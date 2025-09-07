// Sistema de backup e restore para MDA
import { Pool } from '@neondatabase/serverless';
import fs from 'fs/promises';
import path from 'path';
import { secureLog } from '../src/middleware/security.js';

const {
  DATABASE_URL,
  BACKUP_S3_BUCKET = 'telemed-mda-backups',
  BACKUP_RETENTION_DAYS = 30
} = process.env;

const pool = new Pool({ connectionString: DATABASE_URL });

// Criar backup completo das tabelas MDA
export async function createFullBackup(backupId = null) {
  const timestamp = new Date().toISOString();
  const backupName = backupId || `mda-backup-${Date.now()}`;
  
  secureLog('info', 'Starting MDA backup', { backupName, timestamp });
  
  try {
    const client = await pool.connect();
    
    const backup = {
      metadata: {
        backupName,
        timestamp,
        version: '1.0.0',
        tables: []
      },
      data: {}
    };
    
    // Tabelas MDA para backup
    const mdaTables = [
      'mda_consultations',
      'mda_ai_analyses', 
      'mda_telemedicine_sessions',
      'mda_prescriptions'
    ];
    
    // Fazer backup de cada tabela
    for (const table of mdaTables) {
      secureLog('info', `Backing up table: ${table}`);
      
      // Obter dados da tabela
      const result = await client.query(`SELECT * FROM ${table} ORDER BY id`);
      
      // Obter schema da tabela
      const schemaResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      backup.data[table] = {
        schema: schemaResult.rows,
        rows: result.rows,
        count: result.rowCount
      };
      
      backup.metadata.tables.push({
        name: table,
        count: result.rowCount,
        lastId: result.rows.length > 0 ? Math.max(...result.rows.map(r => r.id || 0)) : 0
      });
      
      secureLog('info', `Table ${table} backed up`, { count: result.rowCount });
    }
    
    client.release();
    
    // Salvar backup localmente
    const backupPath = path.join('backups', `${backupName}.json`);
    await fs.mkdir('backups', { recursive: true });
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
    
    secureLog('info', 'MDA backup completed', { 
      backupName, 
      path: backupPath,
      tables: backup.metadata.tables.length,
      totalRows: backup.metadata.tables.reduce((sum, t) => sum + t.count, 0)
    });
    
    return {
      success: true,
      backupName,
      path: backupPath,
      metadata: backup.metadata
    };
    
  } catch (error) {
    secureLog('error', 'Backup failed', { backupName, error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

// Restaurar backup
export async function restoreBackup(backupPath, options = {}) {
  const { 
    dryRun = false, 
    skipExisting = false,
    tablesOnly = null 
  } = options;
  
  secureLog('info', 'Starting MDA restore', { backupPath, dryRun, skipExisting });
  
  try {
    // Carregar backup
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
    const { metadata, data } = backupData;
    
    if (dryRun) {
      secureLog('info', 'DRY RUN - Restore would process', {
        backup: metadata.backupName,
        timestamp: metadata.timestamp,
        tables: metadata.tables
      });
      return { success: true, dryRun: true, metadata };
    }
    
    const client = await pool.connect();
    
    // Começar transação
    await client.query('BEGIN');
    
    const restored = {
      tables: [],
      totalRows: 0,
      skipped: [],
      errors: []
    };
    
    // Restaurar cada tabela
    const tablesToRestore = tablesOnly || Object.keys(data);
    
    for (const tableName of tablesToRestore) {
      if (!data[tableName]) {
        secureLog('warn', `Table ${tableName} not found in backup`);
        continue;
      }
      
      const tableData = data[tableName];
      secureLog('info', `Restoring table: ${tableName} (${tableData.count} rows)`);
      
      try {
        // Verificar se tabela existe
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
          secureLog('error', `Table ${tableName} does not exist`);
          restored.errors.push(`Table ${tableName} does not exist`);
          continue;
        }
        
        // Limpar tabela se não skipExisting
        if (!skipExisting) {
          await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
          secureLog('info', `Table ${tableName} truncated`);
        }
        
        // Inserir dados
        let insertedRows = 0;
        
        for (const row of tableData.rows) {
          try {
            if (skipExisting) {
              // Verificar se registro já existe
              const existsResult = await client.query(
                `SELECT EXISTS (SELECT 1 FROM ${tableName} WHERE id = $1)`,
                [row.id]
              );
              
              if (existsResult.rows[0].exists) {
                restored.skipped.push(`${tableName}.${row.id}`);
                continue;
              }
            }
            
            // Construir query de insert
            const columns = Object.keys(row);
            const values = columns.map((_, i) => `$${i + 1}`);
            const insertQuery = `
              INSERT INTO ${tableName} (${columns.join(', ')}) 
              VALUES (${values.join(', ')})
            `;
            
            await client.query(insertQuery, Object.values(row));
            insertedRows++;
            
          } catch (rowError) {
            secureLog('error', `Failed to insert row in ${tableName}`, { 
              rowId: row.id, 
              error: rowError.message 
            });
            restored.errors.push(`${tableName}.${row.id}: ${rowError.message}`);
          }
        }
        
        // Resetar sequence se necessário
        if (insertedRows > 0 && !skipExisting) {
          await client.query(`
            SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
                          COALESCE((SELECT MAX(id) FROM ${tableName}), 1), false)
          `);
        }
        
        restored.tables.push({
          name: tableName,
          restored: insertedRows,
          skipped: tableData.count - insertedRows
        });
        
        restored.totalRows += insertedRows;
        
        secureLog('info', `Table ${tableName} restored`, { 
          inserted: insertedRows,
          skipped: tableData.count - insertedRows
        });
        
      } catch (tableError) {
        secureLog('error', `Failed to restore table ${tableName}`, { 
          error: tableError.message 
        });
        restored.errors.push(`${tableName}: ${tableError.message}`);
      }
    }
    
    // Commit da transação
    await client.query('COMMIT');
    client.release();
    
    secureLog('info', 'MDA restore completed', restored);
    
    return {
      success: true,
      restored,
      metadata
    };
    
  } catch (error) {
    secureLog('error', 'Restore failed', { backupPath, error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

// Smoke test após restore
export async function smokeTestAfterRestore() {
  secureLog('info', 'Starting post-restore smoke test');
  
  try {
    const client = await pool.connect();
    const results = {};
    
    // Testar cada tabela MDA
    const mdaTables = [
      'mda_consultations',
      'mda_ai_analyses',
      'mda_telemedicine_sessions', 
      'mda_prescriptions'
    ];
    
    for (const table of mdaTables) {
      // Contar registros
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      
      // Testar query simples
      const sampleResult = await client.query(`SELECT * FROM ${table} LIMIT 1`);
      
      results[table] = {
        count: parseInt(countResult.rows[0].count),
        hasData: sampleResult.rows.length > 0,
        accessible: true
      };
    }
    
    client.release();
    
    // Verificar integridade referencial básica
    const client2 = await pool.connect();
    
    // Verificar se ai_analyses referencia consultations válidas
    const integrityResult = await client2.query(`
      SELECT COUNT(*) as invalid_refs
      FROM mda_ai_analyses a
      LEFT JOIN mda_consultations c ON a.consultation_id = c.id
      WHERE c.id IS NULL AND a.consultation_id IS NOT NULL
    `);
    
    client2.release();
    
    const integrityCheck = parseInt(integrityResult.rows[0].invalid_refs) === 0;
    
    secureLog('info', 'Post-restore smoke test completed', { 
      tables: results,
      integrityCheck 
    });
    
    return {
      success: true,
      tables: results,
      integrityCheck,
      totalRecords: Object.values(results).reduce((sum, t) => sum + t.count, 0)
    };
    
  } catch (error) {
    secureLog('error', 'Smoke test failed', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

// Agendar backups automáticos
export function scheduleBackups() {
  // Backup diário às 2:00 AM
  const dailyBackup = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour === 2) {
      createFullBackup(`daily-${now.toISOString().split('T')[0]}`);
    }
  };
  
  // Executar verificação a cada hora
  setInterval(dailyBackup, 60 * 60 * 1000);
  
  secureLog('info', 'Backup scheduler initialized');
}

// CLI para executar backup/restore
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      createFullBackup().then(result => {
        console.log('Backup result:', result);
        process.exit(result.success ? 0 : 1);
      });
      break;
      
    case 'restore':
      const backupPath = process.argv[3];
      if (!backupPath) {
        console.error('Usage: node backup-restore.js restore <backup-path>');
        process.exit(1);
      }
      restoreBackup(backupPath).then(result => {
        console.log('Restore result:', result);
        process.exit(result.success ? 0 : 1);
      });
      break;
      
    case 'smoke-test':
      smokeTestAfterRestore().then(result => {
        console.log('Smoke test result:', result);
        process.exit(result.success ? 0 : 1);
      });
      break;
      
    default:
      console.log(`
MDA Backup & Restore Tool

Commands:
  backup                    - Create full backup
  restore <backup-path>     - Restore from backup
  smoke-test               - Run post-restore smoke test

Examples:
  node backup-restore.js backup
  node backup-restore.js restore backups/mda-backup-123456.json
  node backup-restore.js smoke-test
      `);
      process.exit(1);
  }
}
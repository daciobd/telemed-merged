/**
 * TeleMed Logs Cleanup Job
 * Remove logs com mais de 30 dias para compliance
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function runCleanupJob() {
  try {
    console.log('🗑️ Starting TeleMed logs cleanup job...');
    
    const startTime = Date.now();
    const jobId = `cleanup_${startTime}`;
    
    // Encontrar logs expirados (mais de 30 dias)
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);
    
    const expiredLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { expiresAt: { lte: new Date() } },
          { createdAt: { lte: cutoffDate } }
        ]
      },
      select: { id: true, createdAt: true }
    });
    
    console.log(`📊 Found ${expiredLogs.length} expired logs`);
    
    if (expiredLogs.length === 0) {
      await logJobResult(jobId, 0, 'No logs to delete');
      return { deleted: 0, jobId, message: 'No logs to delete' };
    }
    
    // Deletar em batches de 1000
    let totalDeleted = 0;
    const batchSize = 1000;
    
    for (let i = 0; i < expiredLogs.length; i += batchSize) {
      const batch = expiredLogs.slice(i, i + batchSize);
      const result = await prisma.auditLog.deleteMany({
        where: {
          id: { in: batch.map(log => log.id) }
        }
      });
      totalDeleted += result.count;
      
      console.log(`🗑️ Batch ${Math.floor(i/batchSize) + 1}: ${result.count} logs deleted`);
    }
    
    const duration = Date.now() - startTime;
    
    // Log de auditoria do job
    await logJobResult(jobId, totalDeleted, `Cleanup completed in ${duration}ms`);
    
    console.log(`✅ Cleanup job completed: ${totalDeleted} logs deleted in ${duration}ms`);
    
    return { 
      deleted: totalDeleted, 
      jobId,
      duration_ms: duration,
      message: `Successfully deleted ${totalDeleted} expired logs`
    };
    
  } catch (error) {
    console.error('❌ Cleanup job failed:', error.message);
    
    // Log do erro
    try {
      await logJobResult(`cleanup_error_${Date.now()}`, 0, `Error: ${error.message}`);
    } catch (logError) {
      console.error('Failed to log cleanup error:', logError.message);
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function logJobResult(jobId, deletedCount, message) {
  try {
    await prisma.auditLog.create({
      data: {
        traceId: jobId,
        eventType: deletedCount > 0 ? 'logs_cleanup_completed' : 'logs_cleanup_no_action',
        category: 'system',
        level: 'INFO',
        payload: {
          deleted_count: deletedCount,
          message: message,
          timestamp: new Date().toISOString()
        },
        userAgent: 'cron-job',
        ipHash: 'internal'
      }
    });
  } catch (error) {
    console.warn('Failed to log cleanup result:', error.message);
  }
}

// Se executado diretamente (não importado)
if (import.meta.url === `file://${process.argv[1]}`) {
  runCleanupJob()
    .then(result => {
      console.log('Job result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Job failed:', error);
      process.exit(1);
    });
}
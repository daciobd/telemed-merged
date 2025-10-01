// util/consultation-policy.js - Política de idade de consulta por especialidade

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import YAML from 'yaml';
import { normalize } from './normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * ConsultationPolicy - Gerencia políticas de idade máxima de consulta por especialidade
 */
export class ConsultationPolicy {
  constructor() {
    this.policy = null;
    this.loadPolicy();
  }

  /**
   * Carrega política do arquivo YAML
   */
  loadPolicy() {
    try {
      const policyPath = join(__dirname, '../config/consultation_age_policy.yaml');
      const yamlContent = readFileSync(policyPath, 'utf8');
      this.policy = YAML.parse(yamlContent);
      console.log('✅ Política de idade de consulta carregada:', {
        especialidades: Object.keys(this.policy.max_days_since_consultation || {}).length,
        default: this.policy.max_days_since_consultation?.default || 90
      });
    } catch (error) {
      console.error('❌ Erro ao carregar política de consulta:', error);
      // Fallback para política padrão
      this.policy = {
        max_days_since_consultation: {
          default: 90
        },
        messages: {
          warning_near_limit: "Sua última consulta foi há {days} dias. Considere agendar um retorno em breve.",
          expired: "Sua consulta foi há {days} dias (limite: {limit} dias para {specialty}). Por segurança, você precisa agendar uma nova consulta."
        }
      };
    }
  }

  /**
   * Recarrega política do arquivo (útil para hot-reload)
   */
  reloadPolicy() {
    this.loadPolicy();
  }

  /**
   * Obtém limite de dias para uma especialidade
   * @param {string} specialty - Especialidade médica
   * @returns {number} Número máximo de dias
   */
  getMaxDays(specialty) {
    if (!specialty) {
      return this.policy.max_days_since_consultation.default || 90;
    }

    // Normalizar especialidade (remover acentos, minúsculas)
    const normalizedSpecialty = normalize(specialty).replace(/\s+/g, '_');
    
    // Buscar limite específico ou usar default
    return this.policy.max_days_since_consultation[normalizedSpecialty] 
      || this.policy.max_days_since_consultation.default 
      || 90;
  }

  /**
   * Verifica se uma consulta está dentro do prazo válido
   * @param {number} daysSince - Dias desde a consulta
   * @param {string} specialty - Especialidade médica
   * @returns {{ valid: boolean, limit: number, message: string|null }}
   */
  validateConsultationAge(daysSince, specialty) {
    const limit = this.getMaxDays(specialty);
    
    if (daysSince > limit) {
      const message = this.policy.messages.expired
        .replace('{days}', daysSince)
        .replace('{limit}', limit)
        .replace('{specialty}', specialty || 'sua especialidade');
      
      return {
        valid: false,
        limit,
        daysSince,
        message
      };
    }

    // Se está próximo do limite (80% do tempo), avisar
    const warningThreshold = limit * 0.8;
    if (daysSince > warningThreshold) {
      const message = this.policy.messages.warning_near_limit
        .replace('{days}', daysSince);
      
      return {
        valid: true,
        limit,
        daysSince,
        warning: message
      };
    }

    return {
      valid: true,
      limit,
      daysSince,
      warning: null
    };
  }
}

// Singleton instance
export const consultationPolicy = new ConsultationPolicy();

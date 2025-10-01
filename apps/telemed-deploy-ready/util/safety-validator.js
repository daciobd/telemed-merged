// util/safety-validator.js - Validador de segurança com políticas externalizadas

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import YAML from 'yaml';
import { findKeyword } from './normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * SafetyValidator - Valida perguntas usando políticas YAML externalizadas
 * Permite governança clínica sem necessidade de redeploy
 */
export class SafetyValidator {
  constructor() {
    this.policies = null;
    this.loadPolicies();
  }

  /**
   * Carrega políticas de segurança do arquivo YAML
   */
  loadPolicies() {
    try {
      const policiesPath = join(__dirname, '../config/safety_policies.yaml');
      const yamlContent = readFileSync(policiesPath, 'utf8');
      this.policies = YAML.parse(yamlContent);
      console.log('✅ Políticas de segurança carregadas:', {
        emergency: this.policies.emergency_keywords?.length || 0,
        new_symptoms: this.policies.new_symptom_keywords?.length || 0,
        out_of_scope: this.policies.out_of_scope_keywords?.length || 0,
        deny_phrases: this.policies.deny_phrases?.length || 0
      });
    } catch (error) {
      console.error('❌ Erro ao carregar políticas de segurança:', error);
      // Fallback para políticas hardcoded básicas
      this.policies = {
        emergency_keywords: ['dor no peito', 'falta de ar', 'sangramento'],
        new_symptom_keywords: ['estou sentindo', 'piorou'],
        out_of_scope_keywords: ['posso tomar', 'outro remédio'],
        deny_phrases: ['você deve tomar', 'recomendo que você']
      };
    }
  }

  /**
   * Recarrega políticas do arquivo (útil para hot-reload)
   */
  reloadPolicies() {
    this.loadPolicies();
  }

  /**
   * Verifica se a pergunta indica emergência médica
   * @param {string} question - Pergunta do paciente
   * @returns {{ isEmergency: boolean, keyword: string|null, reason: string|null }}
   */
  checkEmergency(question) {
    const result = findKeyword(question, this.policies.emergency_keywords || []);
    
    if (result.found) {
      return {
        isEmergency: true,
        keyword: result.keyword,
        reason: `Palavra-chave de emergência detectada: "${result.keyword}"`
      };
    }
    
    return { isEmergency: false, keyword: null, reason: null };
  }

  /**
   * Verifica se a pergunta relata sintomas novos
   * @param {string} question - Pergunta do paciente
   * @returns {{ hasNewSymptom: boolean, keyword: string|null, reason: string|null }}
   */
  checkNewSymptoms(question) {
    const result = findKeyword(question, this.policies.new_symptom_keywords || []);
    
    if (result.found) {
      return {
        hasNewSymptom: true,
        keyword: result.keyword,
        reason: `Possível sintoma novo detectado: "${result.keyword}"`
      };
    }
    
    return { hasNewSymptom: false, keyword: null, reason: null };
  }

  /**
   * Verifica se a pergunta está fora do escopo
   * @param {string} question - Pergunta do paciente
   * @returns {{ outOfScope: boolean, keyword: string|null, reason: string|null }}
   */
  checkOutOfScope(question) {
    const result = findKeyword(question, this.policies.out_of_scope_keywords || []);
    
    if (result.found) {
      return {
        outOfScope: true,
        keyword: result.keyword,
        reason: `Pergunta fora do escopo: "${result.keyword}"`
      };
    }
    
    return { outOfScope: false, keyword: null, reason: null };
  }

  /**
   * Valida resposta da IA contra deny-list (última linha de defesa)
   * @param {string} response - Resposta gerada pela IA
   * @throws {Error} Se a resposta contiver frases proibidas
   */
  validateResponse(response) {
    const result = findKeyword(response, this.policies.deny_phrases || []);
    
    if (result.found) {
      throw new Error(`Conteúdo clínico não permitido detectado: "${result.keyword}"`);
    }
  }

  /**
   * Validação completa de uma pergunta
   * @param {string} question - Pergunta do paciente
   * @returns {{ safe: boolean, type: string|null, reason: string|null, keyword: string|null }}
   */
  validateQuestion(question) {
    // 1. Verificar emergência (prioridade máxima)
    const emergency = this.checkEmergency(question);
    if (emergency.isEmergency) {
      return {
        safe: false,
        type: 'emergency',
        reason: emergency.reason,
        keyword: emergency.keyword
      };
    }

    // 2. Verificar sintomas novos
    const newSymptom = this.checkNewSymptoms(question);
    if (newSymptom.hasNewSymptom) {
      return {
        safe: false,
        type: 'new_symptom',
        reason: newSymptom.reason,
        keyword: newSymptom.keyword
      };
    }

    // 3. Verificar fora de escopo
    const outOfScope = this.checkOutOfScope(question);
    if (outOfScope.outOfScope) {
      return {
        safe: false,
        type: 'out_of_scope',
        reason: outOfScope.reason,
        keyword: outOfScope.keyword
      };
    }

    // Pergunta segura
    return {
      safe: true,
      type: null,
      reason: null,
      keyword: null
    };
  }
}

// Singleton instance
export const safetyValidator = new SafetyValidator();

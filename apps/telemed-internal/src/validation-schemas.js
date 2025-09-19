/**
 * TeleMed Event Validation Schemas
 * Contrato padronizado para eventos do funil
 */

export const EVENT_SCHEMAS = {
  // Signup events
  'signup_started': {
    required: ['user_type'],
    optional: ['referrer', 'utm_source', 'utm_campaign']
  },
  'signup_form_completed': {
    required: ['user_type', 'form_fields'],
    optional: ['validation_errors', 'time_spent_seconds']
  },
  'signup_verification_sent': {
    required: ['user_type', 'verification_method'],
    optional: ['phone_number_hash', 'email_hash']
  },
  'signup_completed': {
    required: ['user_id', 'user_type'],
    optional: ['profile_completion_percentage', 'onboarding_step']
  },
  
  // Consultation events
  'consult_request_created': {
    required: ['request_id', 'user_id', 'specialty'],
    optional: ['symptoms', 'priority_level', 'preferred_time']
  },
  'consult_started': {
    required: ['consult_id', 'doctor_id', 'patient_id'],
    optional: ['wait_time_minutes', 'connection_quality']
  },
  'consult_ended': {
    required: ['consult_id', 'duration_minutes', 'completion_reason'],
    optional: ['rating', 'prescription_generated', 'follow_up_scheduled']
  },
  
  // AI Specialty Suggestion events
  'ai_specialty_suggestion_shown': {
    required: ['suggestion_id', 'suggested_specialty', 'confidence_score'],
    optional: ['symptoms_analyzed', 'alternative_suggestions']
  },
  'ai_specialty_suggestion_accepted': {
    required: ['suggestion_id', 'accepted_specialty'],
    optional: ['user_feedback', 'time_to_decision_seconds']
  },
  'ai_specialty_suggestion_rejected': {
    required: ['suggestion_id', 'rejected_specialty', 'user_selected_specialty'],
    optional: ['rejection_reason', 'feedback_text']
  },
  
  // Feedback events
  'feedback_submitted': {
    required: ['feedback_type', 'rating'],
    optional: ['comment', 'feature_area', 'user_id', 'session_id']
  }
};

/**
 * Validar evento conforme schema
 */
export function validateEvent(eventType, payload) {
  const schema = EVENT_SCHEMAS[eventType];
  
  if (!schema) {
    return {
      valid: false,
      error: `Unknown event type: ${eventType}`,
      normalizedPayload: payload
    };
  }
  
  const errors = [];
  const normalizedPayload = { ...payload };
  
  // Verificar campos obrigatórios
  for (const field of schema.required) {
    if (!(field in payload) || payload[field] === null || payload[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Normalizar e validar tipos
  if (normalizedPayload.user_id && typeof normalizedPayload.user_id !== 'string') {
    normalizedPayload.user_id = String(normalizedPayload.user_id);
  }
  
  if (normalizedPayload.rating && (normalizedPayload.rating < 1 || normalizedPayload.rating > 5)) {
    errors.push('Rating must be between 1 and 5');
  }
  
  if (normalizedPayload.confidence_score && (normalizedPayload.confidence_score < 0 || normalizedPayload.confidence_score > 1)) {
    errors.push('Confidence score must be between 0 and 1');
  }
  
  // Adicionar timestamp se não presente
  if (!normalizedPayload.timestamp) {
    normalizedPayload.timestamp = new Date().toISOString();
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    normalizedPayload
  };
}
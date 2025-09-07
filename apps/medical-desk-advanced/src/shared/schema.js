// Schema Drizzle com prefixo mda_ para evitar colisões
import { pgTable, serial, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

// Tabelas MDA com prefixo para evitar colisão
export const mda_consultations = pgTable('mda_consultations', {
  id: serial('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  doctorId: text('doctor_id').notNull(),
  status: text('status').notNull().default('active'),
  symptoms: jsonb('symptoms'),
  aiAnalysis: jsonb('ai_analysis'),
  prescription: jsonb('prescription'),
  sessionData: jsonb('session_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const mda_ai_analyses = pgTable('mda_ai_analyses', {
  id: serial('id').primaryKey(),
  consultationId: integer('consultation_id').references(() => mda_consultations.id),
  symptoms: jsonb('symptoms').notNull(),
  triage: text('triage').notNull(),
  recommendations: jsonb('recommendations'),
  confidence: integer('confidence'),
  modelVersion: text('model_version'),
  createdAt: timestamp('created_at').defaultNow()
});

export const mda_telemedicine_sessions = pgTable('mda_telemedicine_sessions', {
  id: serial('id').primaryKey(),
  consultationId: integer('consultation_id').references(() => mda_consultations.id),
  roomId: text('room_id').notNull(),
  status: text('status').notNull().default('waiting'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  recordingUrl: text('recording_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});

export const mda_prescriptions = pgTable('mda_prescriptions', {
  id: serial('id').primaryKey(),
  consultationId: integer('consultation_id').references(() => mda_consultations.id),
  medications: jsonb('medications').notNull(),
  instructions: text('instructions'),
  validity: timestamp('validity'),
  pdfUrl: text('pdf_url'),
  digitalSignature: text('digital_signature'),
  createdAt: timestamp('created_at').defaultNow()
});
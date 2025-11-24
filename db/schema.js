import { pgTable, serial, text, timestamp, integer, boolean, decimal, json, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['patient', 'doctor', 'admin']);
export const accountTypeEnum = pgEnum('account_type', ['marketplace', 'virtual_office', 'hybrid']);
export const monthlyPlanEnum = pgEnum('monthly_plan', ['basic', 'professional', 'premium', 'none']);
export const consultationStatusEnum = pgEnum('consultation_status', [
  'pending',
  'doctor_matched',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
]);
export const consultationTypeEnum = pgEnum('consultation_type', [
  'primeira_consulta',
  'retorno',
  'urgente',
  'check_up'
]);

// Tabela: users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('patient'),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  cpf: text('cpf').unique(),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela: patients
export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  dateOfBirth: timestamp('date_of_birth'),
  gender: text('gender'),
  address: json('address'),
  medicalHistory: json('medical_history'),
  emergencyContact: json('emergency_contact'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela: doctors
export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  crm: text('crm').notNull().unique(),
  crmState: text('crm_state').notNull(),
  specialties: json('specialties'),
  accountType: accountTypeEnum('account_type').default('marketplace'),
  monthlyPlan: monthlyPlanEnum('monthly_plan').default('none'),
  planStartDate: timestamp('plan_start_date'),
  planEndDate: timestamp('plan_end_date'),
  customUrl: text('custom_url').unique(),
  consultationPricing: json('consultation_pricing'),
  isAvailableMarketplace: boolean('is_available_marketplace').default(true),
  minPriceMarketplace: decimal('min_price_marketplace', { precision: 10, scale: 2 }),
  bio: text('bio'),
  education: json('education'),
  experience: json('experience'),
  certificates: json('certificates'),
  availability: json('availability'),
  consultationDuration: integer('consultation_duration').default(30),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  totalConsultations: integer('total_consultations').default(0),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela: virtual_office_settings
export const virtualOfficeSettings = pgTable('virtual_office_settings', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull().unique(),
  autoAcceptBookings: boolean('auto_accept_bookings').default(false),
  requirePrepayment: boolean('require_prepayment').default(true),
  allowCancellation: boolean('allow_cancellation').default(true),
  cancellationHours: integer('cancellation_hours').default(24),
  customBranding: json('custom_branding'),
  welcomeMessage: text('welcome_message'),
  bookingInstructions: text('booking_instructions'),
  googleCalendarId: text('google_calendar_id'),
  googleCalendarSync: boolean('google_calendar_sync').default(false),
  emailNotifications: boolean('email_notifications').default(true),
  whatsappNotifications: boolean('whatsapp_notifications').default(false),
  smsNotifications: boolean('sms_notifications').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela: consultations
export const consultations = pgTable('consultations', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id),
  consultationType: consultationTypeEnum('consultation_type').notNull(),
  isMarketplace: boolean('is_marketplace').default(true),
  scheduledFor: timestamp('scheduled_for'),
  duration: integer('duration').default(30),
  patientOffer: decimal('patient_offer', { precision: 10, scale: 2 }),
  agreedPrice: decimal('agreed_price', { precision: 10, scale: 2 }),
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }),
  doctorEarnings: decimal('doctor_earnings', { precision: 10, scale: 2 }),
  status: consultationStatusEnum('status').default('pending'),
  chiefComplaint: text('chief_complaint'),
  clinicalNotes: text('clinical_notes'),
  diagnosis: text('diagnosis'),
  prescription: json('prescription'),
  meetingUrl: text('meeting_url'),
  meetingStartedAt: timestamp('meeting_started_at'),
  meetingEndedAt: timestamp('meeting_ended_at'),
  patientRating: integer('patient_rating'),
  patientFeedback: text('patient_feedback'),
  doctorRating: integer('doctor_rating'),
  doctorFeedback: text('doctor_feedback'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela: bids
export const bids = pgTable('bids', {
  id: serial('id').primaryKey(),
  consultationId: integer('consultation_id').references(() => consultations.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  bidAmount: decimal('bid_amount', { precision: 10, scale: 2 }).notNull(),
  message: text('message'),
  isAccepted: boolean('is_accepted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

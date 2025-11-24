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

// ============================================
// TABELA: users (base para pacientes e médicos)
// ============================================
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

// ============================================
// TABELA: patients
// ============================================
export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  dateOfBirth: timestamp('date_of_birth'),
  gender: text('gender'),
  address: json('address'), // { street, city, state, zipCode }
  medicalHistory: json('medical_history'), // alergias, condições crônicas, etc
  emergencyContact: json('emergency_contact'), // { name, phone, relationship }
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// TABELA: doctors
// ============================================
export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  
  // Dados profissionais
  crm: text('crm').notNull().unique(),
  crmState: text('crm_state').notNull(),
  specialties: json('specialties'), // ['Cardiologia', 'Clínica Geral']
  
  // Tipo de conta e plano
  accountType: accountTypeEnum('account_type').default('marketplace'),
  monthlyPlan: monthlyPlanEnum('monthly_plan').default('none'),
  planStartDate: timestamp('plan_start_date'),
  planEndDate: timestamp('plan_end_date'),
  
  // Consultório Virtual
  customUrl: text('custom_url').unique(), // 'dr-joaosilva'
  consultationPricing: json('consultation_pricing'), // { primeira_consulta: 150, retorno: 100, urgente: 200 }
  
  // Marketplace
  isAvailableMarketplace: boolean('is_available_marketplace').default(true),
  minPriceMarketplace: decimal('min_price_marketplace', { precision: 10, scale: 2 }),
  
  // Perfil profissional
  bio: text('bio'),
  education: json('education'), // formação acadêmica
  experience: json('experience'), // experiência profissional
  certificates: json('certificates'), // certificados e especializações
  
  // Disponibilidade e configurações
  availability: json('availability'), // horários disponíveis por dia da semana
  consultationDuration: integer('consultation_duration').default(30), // minutos
  
  // Ratings
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  totalConsultations: integer('total_consultations').default(0),
  
  // Status
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TABELA: virtual_office_settings
// ============================================
export const virtualOfficeSettings = pgTable('virtual_office_settings', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull().unique(),
  
  // Configurações de agendamento
  autoAcceptBookings: boolean('auto_accept_bookings').default(false),
  requirePrepayment: boolean('require_prepayment').default(true),
  allowCancellation: boolean('allow_cancellation').default(true),
  cancellationHours: integer('cancellation_hours').default(24),
  
  // Personalização
  customBranding: json('custom_branding'), // { primaryColor, logo, bannerImage }
  welcomeMessage: text('welcome_message'),
  bookingInstructions: text('booking_instructions'),
  
  // Integrações
  googleCalendarId: text('google_calendar_id'),
  googleCalendarSync: boolean('google_calendar_sync').default(false),
  
  // Notificações
  emailNotifications: boolean('email_notifications').default(true),
  whatsappNotifications: boolean('whatsapp_notifications').default(false),
  smsNotifications: boolean('sms_notifications').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TABELA: consultations
// ============================================
export const consultations = pgTable('consultations', {
  id: serial('id').primaryKey(),
  
  // Participantes
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id),
  
  // Tipo de consulta
  consultationType: consultationTypeEnum('consultation_type').notNull(),
  isMarketplace: boolean('is_marketplace').default(true), // true = leilão, false = direto
  
  // Agendamento
  scheduledFor: timestamp('scheduled_for'),
  duration: integer('duration').default(30), // minutos
  
  // Preço
  patientOffer: decimal('patient_offer', { precision: 10, scale: 2 }), // oferta do paciente (marketplace)
  agreedPrice: decimal('agreed_price', { precision: 10, scale: 2 }), // preço final acordado
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }), // taxa da plataforma
  doctorEarnings: decimal('doctor_earnings', { precision: 10, scale: 2 }), // ganho líquido do médico
  
  // Status
  status: consultationStatusEnum('status').default('pending'),
  
  // Detalhes clínicos
  chiefComplaint: text('chief_complaint'), // queixa principal do paciente
  clinicalNotes: text('clinical_notes'), // anotações do médico
  diagnosis: text('diagnosis'),
  prescription: json('prescription'), // prescrições
  
  // Videochamada
  meetingUrl: text('meeting_url'),
  meetingStartedAt: timestamp('meeting_started_at'),
  meetingEndedAt: timestamp('meeting_ended_at'),
  
  // Avaliação
  patientRating: integer('patient_rating'), // 1-5
  patientFeedback: text('patient_feedback'),
  doctorRating: integer('doctor_rating'), // 1-5
  doctorFeedback: text('doctor_feedback'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
});

// ============================================
// TABELA: consultation_bids (leilão reverso - marketplace)
// ============================================
export const consultationBids = pgTable('consultation_bids', {
  id: serial('id').primaryKey(),
  consultationId: integer('consultation_id').references(() => consultations.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  
  bidPrice: decimal('bid_price', { precision: 10, scale: 2 }).notNull(),
  message: text('message'), // mensagem do médico para o paciente
  
  isAccepted: boolean('is_accepted').default(false),
  isRejected: boolean('is_rejected').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  respondedAt: timestamp('responded_at'),
});

// ============================================
// TABELA: payments
// ============================================
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  consultationId: integer('consultation_id').references(() => consultations.id),
  doctorId: integer('doctor_id').references(() => doctors.id), // para pagamentos de plano
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentType: text('payment_type').notNull(), // 'consultation' ou 'subscription'
  paymentMethod: text('payment_method'), // 'credit_card', 'pix', etc
  
  // Integração com gateway
  gatewayTransactionId: text('gateway_transaction_id'),
  gatewayStatus: text('gateway_status'),
  gatewayResponse: json('gateway_response'),
  
  status: text('status').default('pending'), // pending, completed, failed, refunded
  
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// TABELA: subscriptions (para planos mensais)
// ============================================
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  
  plan: monthlyPlanEnum('plan').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  
  status: text('status').default('active'), // active, cancelled, expired, suspended
  
  startDate: timestamp('start_date').defaultNow(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAt: timestamp('cancel_at'),
  cancelledAt: timestamp('cancelled_at'),
  
  // Integração com gateway de pagamento recorrente
  gatewaySubscriptionId: text('gateway_subscription_id'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TABELA: patient_doctor_relationships (pacientes do consultório)
// ============================================
export const patientDoctorRelationships = pgTable('patient_doctor_relationships', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  
  isPrimaryDoctor: boolean('is_primary_doctor').default(false),
  firstConsultationDate: timestamp('first_consultation_date'),
  lastConsultationDate: timestamp('last_consultation_date'),
  totalConsultations: integer('total_consultations').default(0),
  
  // Notas do médico sobre o paciente
  privateNotes: text('private_notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TABELA: notifications
// ============================================
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  
  type: text('type').notNull(), // 'consultation_booked', 'new_bid', 'reminder', etc
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: json('data'), // dados adicionais específicos do tipo
  
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// EXPORTS
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;

export type Consultation = typeof consultations.$inferSelect;
export type NewConsultation = typeof consultations.$inferInsert;

export type VirtualOfficeSetting = typeof virtualOfficeSettings.$inferSelect;
export type NewVirtualOfficeSetting = typeof virtualOfficeSettings.$inferInsert;

export type ConsultationBid = typeof consultationBids.$inferSelect;
export type NewConsultationBid = typeof consultationBids.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

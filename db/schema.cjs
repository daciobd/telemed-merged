"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = exports.patientDoctorRelationships = exports.subscriptions = exports.payments = exports.consultationBids = exports.bids = exports.consultations = exports.virtualOfficeSettings = exports.doctors = exports.patients = exports.users = exports.consultationTypeEnum = exports.consultationStatusEnum = exports.monthlyPlanEnum = exports.accountTypeEnum = exports.userRoleEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
// Enums
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['patient', 'doctor', 'admin']);
exports.accountTypeEnum = (0, pg_core_1.pgEnum)('account_type', ['marketplace', 'virtual_office', 'hybrid']);
exports.monthlyPlanEnum = (0, pg_core_1.pgEnum)('monthly_plan', ['basic', 'professional', 'premium', 'none']);
exports.consultationStatusEnum = (0, pg_core_1.pgEnum)('consultation_status', [
    'pending',
    'doctor_matched',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
]);
exports.consultationTypeEnum = (0, pg_core_1.pgEnum)('consultation_type', [
    'primeira_consulta',
    'retorno',
    'urgente',
    'check_up',
    'video',
    'presencial'
]);
// ============================================
// TABELA: users (base para pacientes e médicos)
// ============================================
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    role: (0, exports.userRoleEnum)('role').notNull().default('patient'),
    fullName: (0, pg_core_1.text)('full_name').notNull(),
    phone: (0, pg_core_1.text)('phone'),
    cpf: (0, pg_core_1.text)('cpf').unique(),
    profileImage: (0, pg_core_1.text)('profile_image'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// ============================================
// TABELA: patients
// ============================================
exports.patients = (0, pg_core_1.pgTable)('patients', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(function () { return exports.users.id; }).notNull().unique(),
    dateOfBirth: (0, pg_core_1.timestamp)('date_of_birth'),
    gender: (0, pg_core_1.text)('gender'),
    address: (0, pg_core_1.json)('address'), // { street, city, state, zipCode }
    medicalHistory: (0, pg_core_1.json)('medical_history'), // alergias, condições crônicas, etc
    emergencyContact: (0, pg_core_1.json)('emergency_contact'), // { name, phone, relationship }
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
// ============================================
// TABELA: doctors
// ============================================
exports.doctors = (0, pg_core_1.pgTable)('doctors', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(function () { return exports.users.id; }).notNull().unique(),
    // Dados profissionais
    crm: (0, pg_core_1.text)('crm').notNull().unique(),
    crmState: (0, pg_core_1.text)('crm_state').notNull(),
    specialties: (0, pg_core_1.json)('specialties'), // ['Cardiologia', 'Clínica Geral']
    // Tipo de conta e plano
    accountType: (0, exports.accountTypeEnum)('account_type').default('marketplace'),
    monthlyPlan: (0, exports.monthlyPlanEnum)('monthly_plan').default('none'),
    planStartDate: (0, pg_core_1.timestamp)('plan_start_date'),
    planEndDate: (0, pg_core_1.timestamp)('plan_end_date'),
    // Consultório Virtual
    customUrl: (0, pg_core_1.text)('custom_url').unique(), // 'dr-joaosilva'
    consultationPricing: (0, pg_core_1.json)('consultation_pricing'), // { primeira_consulta: 150, retorno: 100, urgente: 200 }
    // Marketplace
    isAvailableMarketplace: (0, pg_core_1.boolean)('is_available_marketplace').default(true),
    minPriceMarketplace: (0, pg_core_1.decimal)('min_price_marketplace', { precision: 10, scale: 2 }),
    // Perfil profissional
    bio: (0, pg_core_1.text)('bio'),
    education: (0, pg_core_1.json)('education'), // formação acadêmica
    experience: (0, pg_core_1.json)('experience'), // experiência profissional
    certificates: (0, pg_core_1.json)('certificates'), // certificados e especializações
    // Disponibilidade e configurações
    availability: (0, pg_core_1.json)('availability'), // horários disponíveis por dia da semana
    consultationDuration: (0, pg_core_1.integer)('consultation_duration').default(30), // minutos
    // Ratings
    rating: (0, pg_core_1.decimal)('rating', { precision: 3, scale: 2 }).default('0'),
    totalConsultations: (0, pg_core_1.integer)('total_consultations').default(0),
    // Status
    isVerified: (0, pg_core_1.boolean)('is_verified').default(false),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// ============================================
// TABELA: virtual_office_settings
// ============================================
exports.virtualOfficeSettings = (0, pg_core_1.pgTable)('virtual_office_settings', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    doctorId: (0, pg_core_1.integer)('doctor_id').references(function () { return exports.doctors.id; }).notNull().unique(),
    // Configurações de agendamento
    autoAcceptBookings: (0, pg_core_1.boolean)('auto_accept_bookings').default(false),
    requirePrepayment: (0, pg_core_1.boolean)('require_prepayment').default(true),
    allowCancellation: (0, pg_core_1.boolean)('allow_cancellation').default(true),
    cancellationHours: (0, pg_core_1.integer)('cancellation_hours').default(24),
    // Personalização
    customBranding: (0, pg_core_1.json)('custom_branding'), // { primaryColor, logo, bannerImage }
    welcomeMessage: (0, pg_core_1.text)('welcome_message'),
    bookingInstructions: (0, pg_core_1.text)('booking_instructions'),
    // Integrações
    googleCalendarId: (0, pg_core_1.text)('google_calendar_id'),
    googleCalendarSync: (0, pg_core_1.boolean)('google_calendar_sync').default(false),
    // Notificações
    emailNotifications: (0, pg_core_1.boolean)('email_notifications').default(true),
    whatsappNotifications: (0, pg_core_1.boolean)('whatsapp_notifications').default(false),
    smsNotifications: (0, pg_core_1.boolean)('sms_notifications').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// ============================================
// TABELA: consultations
// ============================================
exports.consultations = (0, pg_core_1.pgTable)('consultations', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    // Participantes
    patientId: (0, pg_core_1.integer)('patient_id').references(function () { return exports.patients.id; }).notNull(),
    doctorId: (0, pg_core_1.integer)('doctor_id').references(function () { return exports.doctors.id; }),
    // Tipo de consulta
    consultationType: (0, exports.consultationTypeEnum)('consultation_type').notNull(),
    isMarketplace: (0, pg_core_1.boolean)('is_marketplace').default(true), // true = leilão, false = direto
    // Agendamento
    scheduledFor: (0, pg_core_1.timestamp)('scheduled_for'),
    duration: (0, pg_core_1.integer)('duration').default(30), // minutos
    // Preço
    patientOffer: (0, pg_core_1.decimal)('patient_offer', { precision: 10, scale: 2 }), // oferta do paciente (marketplace)
    agreedPrice: (0, pg_core_1.decimal)('agreed_price', { precision: 10, scale: 2 }), // preço final acordado
    platformFee: (0, pg_core_1.decimal)('platform_fee', { precision: 10, scale: 2 }), // taxa da plataforma
    doctorEarnings: (0, pg_core_1.decimal)('doctor_earnings', { precision: 10, scale: 2 }), // ganho líquido do médico
    // Status
    status: (0, exports.consultationStatusEnum)('status').default('pending'),
    // Detalhes clínicos
    chiefComplaint: (0, pg_core_1.text)('chief_complaint'), // queixa principal do paciente
    clinicalNotes: (0, pg_core_1.text)('clinical_notes'), // anotações do médico
    diagnosis: (0, pg_core_1.text)('diagnosis'),
    prescription: (0, pg_core_1.json)('prescription'), // prescrições
    // Videochamada
    meetingUrl: (0, pg_core_1.text)('meeting_url'),
    meetingStartedAt: (0, pg_core_1.timestamp)('meeting_started_at'),
    meetingEndedAt: (0, pg_core_1.timestamp)('meeting_ended_at'),
    // Avaliação
    patientRating: (0, pg_core_1.integer)('patient_rating'), // 1-5
    patientFeedback: (0, pg_core_1.text)('patient_feedback'),
    doctorRating: (0, pg_core_1.integer)('doctor_rating'), // 1-5
    doctorFeedback: (0, pg_core_1.text)('doctor_feedback'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// ============================================
// TABELA: bids (leilão - marketplace) - NOME REAL DA TABELA NO BANCO
// ============================================
exports.bids = (0, pg_core_1.pgTable)('bids', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    consultationId: (0, pg_core_1.integer)('consultation_id').references(function () { return exports.consultations.id; }).notNull(),
    doctorId: (0, pg_core_1.integer)('doctor_id').references(function () { return exports.doctors.id; }).notNull(),
    bidAmount: (0, pg_core_1.decimal)('bid_amount', { precision: 10, scale: 2 }).notNull(),
    message: (0, pg_core_1.text)('message'),
    isAccepted: (0, pg_core_1.boolean)('is_accepted').default(false),
    // Valores financeiros calculados no momento da aceitação
    platformFee: (0, pg_core_1.decimal)('platform_fee', { precision: 10, scale: 2 }),
    doctorEarnings: (0, pg_core_1.decimal)('doctor_earnings', { precision: 10, scale: 2 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
// Alias para manter compatibilidade (pode ser removido no futuro)
exports.consultationBids = exports.bids;
// ============================================
// TABELA: payments
// ============================================
exports.payments = (0, pg_core_1.pgTable)('payments', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    consultationId: (0, pg_core_1.integer)('consultation_id').references(function () { return exports.consultations.id; }),
    doctorId: (0, pg_core_1.integer)('doctor_id').references(function () { return exports.doctors.id; }), // para pagamentos de plano
    amount: (0, pg_core_1.decimal)('amount', { precision: 10, scale: 2 }).notNull(),
    paymentType: (0, pg_core_1.text)('payment_type').notNull(), // 'consultation' ou 'subscription'
    paymentMethod: (0, pg_core_1.text)('payment_method'), // 'credit_card', 'pix', etc
    // Integração com gateway
    gatewayTransactionId: (0, pg_core_1.text)('gateway_transaction_id'),
    gatewayStatus: (0, pg_core_1.text)('gateway_status'),
    gatewayResponse: (0, pg_core_1.json)('gateway_response'),
    status: (0, pg_core_1.text)('status').default('pending'), // pending, completed, failed, refunded
    paidAt: (0, pg_core_1.timestamp)('paid_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
// ============================================
// TABELA: subscriptions (para planos mensais)
// ============================================
exports.subscriptions = (0, pg_core_1.pgTable)('subscriptions', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    doctorId: (0, pg_core_1.integer)('doctor_id').references(function () { return exports.doctors.id; }).notNull(),
    plan: (0, exports.monthlyPlanEnum)('plan').notNull(),
    price: (0, pg_core_1.decimal)('price', { precision: 10, scale: 2 }).notNull(),
    status: (0, pg_core_1.text)('status').default('active'), // active, cancelled, expired, suspended
    startDate: (0, pg_core_1.timestamp)('start_date').defaultNow(),
    currentPeriodEnd: (0, pg_core_1.timestamp)('current_period_end').notNull(),
    cancelAt: (0, pg_core_1.timestamp)('cancel_at'),
    cancelledAt: (0, pg_core_1.timestamp)('cancelled_at'),
    // Integração com gateway de pagamento recorrente
    gatewaySubscriptionId: (0, pg_core_1.text)('gateway_subscription_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// ============================================
// TABELA: patient_doctor_relationships (pacientes do consultório)
// ============================================
exports.patientDoctorRelationships = (0, pg_core_1.pgTable)('patient_doctor_relationships', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    patientId: (0, pg_core_1.integer)('patient_id').references(function () { return exports.patients.id; }).notNull(),
    doctorId: (0, pg_core_1.integer)('doctor_id').references(function () { return exports.doctors.id; }).notNull(),
    isPrimaryDoctor: (0, pg_core_1.boolean)('is_primary_doctor').default(false),
    firstConsultationDate: (0, pg_core_1.timestamp)('first_consultation_date'),
    lastConsultationDate: (0, pg_core_1.timestamp)('last_consultation_date'),
    totalConsultations: (0, pg_core_1.integer)('total_consultations').default(0),
    // Notas do médico sobre o paciente
    privateNotes: (0, pg_core_1.text)('private_notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// ============================================
// TABELA: notifications
// ============================================
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(function () { return exports.users.id; }).notNull(),
    type: (0, pg_core_1.text)('type').notNull(), // 'consultation_booked', 'new_bid', 'reminder', etc
    title: (0, pg_core_1.text)('title').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    data: (0, pg_core_1.json)('data'), // dados adicionais específicos do tipo
    isRead: (0, pg_core_1.boolean)('is_read').default(false),
    readAt: (0, pg_core_1.timestamp)('read_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});

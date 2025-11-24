import { db } from './index';
import { 
  users, 
  doctors, 
  patients, 
  consultations,
  virtualOfficeSettings,
  consultationBids,
  patientDoctorRelationships 
} from './schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

/**
 * QUERIES RÁPIDAS - TeleMed Merge
 * 
 * Use este arquivo como referência para queries comuns.
 * Copie e adapte conforme necessário.
 */

// ============================================
// DOCTORS - Queries
// ============================================

// Buscar médico por customUrl (página pública)
export async function getDoctorByCustomUrl(customUrl: string) {
  return await db
    .select()
    .from(doctors)
    .innerJoin(users, eq(doctors.userId, users.id))
    .where(eq(doctors.customUrl, customUrl))
    .limit(1);
}

// Buscar médicos disponíveis no marketplace
export async function getMarketplaceDoctors(specialty?: string) {
  return await db
    .select()
    .from(doctors)
    .innerJoin(users, eq(doctors.userId, users.id))
    .where(
      and(
        eq(doctors.isAvailableMarketplace, true),
        eq(doctors.isActive, true),
        specialty ? sql`${doctors.specialties} @> ${JSON.stringify([specialty])}` : undefined
      )
    );
}

// Buscar médicos com consultório virtual ativo
export async function getVirtualOfficeDoctors() {
  return await db
    .select()
    .from(doctors)
    .innerJoin(users, eq(doctors.userId, users.id))
    .where(
      and(
        sql`${doctors.accountType} IN ('virtual_office', 'hybrid')`,
        eq(doctors.isActive, true)
      )
    );
}

// Verificar se customUrl está disponível
export async function isCustomUrlAvailable(customUrl: string) {
  const existing = await db
    .select()
    .from(doctors)
    .where(eq(doctors.customUrl, customUrl))
    .limit(1);
  
  return existing.length === 0;
}

// ============================================
// CONSULTATIONS - Queries
// ============================================

// Criar consulta marketplace (leilão reverso)
export async function createMarketplaceConsultation(data: {
  patientId: number;
  consultationType: string;
  patientOffer: string;
  chiefComplaint: string;
  scheduledFor?: Date;
}) {
  return await db.insert(consultations).values({
    patientId: data.patientId,
    consultationType: data.consultationType as any,
    isMarketplace: true,
    patientOffer: data.patientOffer,
    chiefComplaint: data.chiefComplaint,
    scheduledFor: data.scheduledFor,
    status: 'pending',
  }).returning();
}

// Criar consulta direta (consultório virtual)
export async function createDirectConsultation(data: {
  patientId: number;
  doctorId: number;
  consultationType: string;
  agreedPrice: string;
  scheduledFor: Date;
  chiefComplaint?: string;
}) {
  return await db.insert(consultations).values({
    patientId: data.patientId,
    doctorId: data.doctorId,
    consultationType: data.consultationType as any,
    isMarketplace: false,
    agreedPrice: data.agreedPrice,
    scheduledFor: data.scheduledFor,
    chiefComplaint: data.chiefComplaint,
    status: 'scheduled',
  }).returning();
}

// Buscar consultas pendentes no marketplace
export async function getPendingMarketplaceConsultations(specialty?: string) {
  return await db
    .select()
    .from(consultations)
    .innerJoin(patients, eq(consultations.patientId, patients.id))
    .innerJoin(users, eq(patients.userId, users.id))
    .where(
      and(
        eq(consultations.isMarketplace, true),
        eq(consultations.status, 'pending')
      )
    )
    .orderBy(desc(consultations.createdAt));
}

// Buscar agenda do médico (consultório virtual)
export async function getDoctorSchedule(doctorId: number, startDate: Date, endDate: Date) {
  return await db
    .select()
    .from(consultations)
    .where(
      and(
        eq(consultations.doctorId, doctorId),
        gte(consultations.scheduledFor, startDate),
        lte(consultations.scheduledFor, endDate),
        sql`${consultations.status} NOT IN ('cancelled', 'completed')`
      )
    )
    .orderBy(consultations.scheduledFor);
}

// Buscar histórico de consultas do paciente com um médico
export async function getPatientConsultationHistory(patientId: number, doctorId: number) {
  return await db
    .select()
    .from(consultations)
    .where(
      and(
        eq(consultations.patientId, patientId),
        eq(consultations.doctorId, doctorId)
      )
    )
    .orderBy(desc(consultations.scheduledFor));
}

// ============================================
// CONSULTATION BIDS - Queries
// ============================================

// Criar lance no marketplace
export async function createBid(data: {
  consultationId: number;
  doctorId: number;
  bidPrice: string;
  message?: string;
}) {
  return await db.insert(consultationBids).values({
    consultationId: data.consultationId,
    doctorId: data.doctorId,
    bidPrice: data.bidPrice,
    message: data.message,
  }).returning();
}

// Buscar lances de uma consulta
export async function getConsultationBids(consultationId: number) {
  return await db
    .select()
    .from(consultationBids)
    .innerJoin(doctors, eq(consultationBids.doctorId, doctors.id))
    .innerJoin(users, eq(doctors.userId, users.id))
    .where(eq(consultationBids.consultationId, consultationId))
    .orderBy(consultationBids.bidPrice); // menor preço primeiro
}

// Aceitar lance
export async function acceptBid(bidId: number, consultationId: number, doctorId: number) {
  // Marcar lance como aceito
  await db
    .update(consultationBids)
    .set({ isAccepted: true, respondedAt: new Date() })
    .where(eq(consultationBids.id, bidId));
  
  // Atualizar consulta
  const bid = await db.select().from(consultationBids).where(eq(consultationBids.id, bidId)).limit(1);
  if (bid.length > 0) {
    await db
      .update(consultations)
      .set({
        doctorId: doctorId,
        agreedPrice: bid[0].bidPrice,
        status: 'doctor_matched',
      })
      .where(eq(consultations.id, consultationId));
  }
}

// ============================================
// VIRTUAL OFFICE - Queries
// ============================================

// Buscar configurações do consultório
export async function getVirtualOfficeSettings(doctorId: number) {
  return await db
    .select()
    .from(virtualOfficeSettings)
    .where(eq(virtualOfficeSettings.doctorId, doctorId))
    .limit(1);
}

// Atualizar configurações do consultório
export async function updateVirtualOfficeSettings(doctorId: number, settings: any) {
  return await db
    .update(virtualOfficeSettings)
    .set(settings)
    .where(eq(virtualOfficeSettings.doctorId, doctorId))
    .returning();
}

// ============================================
// PATIENT-DOCTOR RELATIONSHIPS - Queries
// ============================================

// Buscar pacientes do médico (base do consultório)
export async function getDoctorPatients(doctorId: number) {
  return await db
    .select()
    .from(patientDoctorRelationships)
    .innerJoin(patients, eq(patientDoctorRelationships.patientId, patients.id))
    .innerJoin(users, eq(patients.userId, users.id))
    .where(eq(patientDoctorRelationships.doctorId, doctorId))
    .orderBy(desc(patientDoctorRelationships.lastConsultationDate));
}

// Criar/atualizar relacionamento médico-paciente
export async function updatePatientDoctorRelationship(patientId: number, doctorId: number) {
  const existing = await db
    .select()
    .from(patientDoctorRelationships)
    .where(
      and(
        eq(patientDoctorRelationships.patientId, patientId),
        eq(patientDoctorRelationships.doctorId, doctorId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    return await db
      .update(patientDoctorRelationships)
      .set({
        lastConsultationDate: new Date(),
        totalConsultations: sql`${patientDoctorRelationships.totalConsultations} + 1`,
      })
      .where(eq(patientDoctorRelationships.id, existing[0].id))
      .returning();
  } else {
    // Criar
    return await db.insert(patientDoctorRelationships).values({
      patientId,
      doctorId,
      firstConsultationDate: new Date(),
      lastConsultationDate: new Date(),
      totalConsultations: 1,
    }).returning();
  }
}

// ============================================
// DASHBOARD - Queries Agregadas
// ============================================

// Dashboard do médico - estatísticas
export async function getDoctorDashboardStats(doctorId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    totalConsultations,
    todayConsultations,
    pendingBids,
    totalEarnings,
  ] = await Promise.all([
    // Total de consultas
    db.select({ count: sql`count(*)` })
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId)),
    
    // Consultas hoje
    db.select({ count: sql`count(*)` })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          gte(consultations.scheduledFor, today)
        )
      ),
    
    // Lances pendentes
    db.select({ count: sql`count(*)` })
      .from(consultationBids)
      .where(
        and(
          eq(consultationBids.doctorId, doctorId),
          eq(consultationBids.isAccepted, false),
          eq(consultationBids.isRejected, false)
        )
      ),
    
    // Ganhos totais
    db.select({ total: sql`sum(${consultations.doctorEarnings})` })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          eq(consultations.status, 'completed')
        )
      ),
  ]);

  return {
    totalConsultations: totalConsultations[0].count,
    todayConsultations: todayConsultations[0].count,
    pendingBids: pendingBids[0].count,
    totalEarnings: totalEarnings[0].total || '0',
  };
}

// Dashboard do paciente - histórico
export async function getPatientDashboard(patientId: number) {
  const [
    upcomingConsultations,
    pastConsultations,
    myDoctors,
  ] = await Promise.all([
    // Próximas consultas
    db.select()
      .from(consultations)
      .innerJoin(doctors, eq(consultations.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(
        and(
          eq(consultations.patientId, patientId),
          gte(consultations.scheduledFor, new Date()),
          sql`${consultations.status} IN ('scheduled', 'doctor_matched')`
        )
      )
      .orderBy(consultations.scheduledFor),
    
    // Consultas passadas
    db.select()
      .from(consultations)
      .innerJoin(doctors, eq(consultations.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(
        and(
          eq(consultations.patientId, patientId),
          eq(consultations.status, 'completed')
        )
      )
      .orderBy(desc(consultations.completedAt))
      .limit(10),
    
    // Meus médicos
    db.select()
      .from(patientDoctorRelationships)
      .innerJoin(doctors, eq(patientDoctorRelationships.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(patientDoctorRelationships.patientId, patientId))
      .orderBy(desc(patientDoctorRelationships.lastConsultationDate)),
  ]);

  return {
    upcomingConsultations,
    pastConsultations,
    myDoctors,
  };
}

// ============================================
// SEARCH - Queries
// ============================================

// Buscar médicos por nome, especialidade ou CRM
export async function searchDoctors(searchTerm: string) {
  return await db
    .select()
    .from(doctors)
    .innerJoin(users, eq(doctors.userId, users.id))
    .where(
      and(
        sql`(
          ${users.fullName} ILIKE ${`%${searchTerm}%`}
          OR ${doctors.crm} ILIKE ${`%${searchTerm}%`}
          OR ${doctors.specialties}::text ILIKE ${`%${searchTerm}%`}
        )`,
        eq(doctors.isActive, true)
      )
    )
    .limit(20);
}

export default {
  // Doctors
  getDoctorByCustomUrl,
  getMarketplaceDoctors,
  getVirtualOfficeDoctors,
  isCustomUrlAvailable,
  
  // Consultations
  createMarketplaceConsultation,
  createDirectConsultation,
  getPendingMarketplaceConsultations,
  getDoctorSchedule,
  getPatientConsultationHistory,
  
  // Bids
  createBid,
  getConsultationBids,
  acceptBid,
  
  // Virtual Office
  getVirtualOfficeSettings,
  updateVirtualOfficeSettings,
  
  // Relationships
  getDoctorPatients,
  updatePatientDoctorRelationship,
  
  // Dashboards
  getDoctorDashboardStats,
  getPatientDashboard,
  
  // Search
  searchDoctors,
};

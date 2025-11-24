import { db } from '../../db';
import { consultations, patients, doctors, users, consultationBids } from '../../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import queries from '../../db/queries';

interface CreateMarketplaceConsultationData {
  patientId: number;
  consultationType: 'primeira_consulta' | 'retorno' | 'urgente' | 'check_up';
  patientOffer: string;
  chiefComplaint: string;
  scheduledFor?: string;
}

interface CreateDirectConsultationData {
  patientId: number;
  doctorId: number;
  consultationType: 'primeira_consulta' | 'retorno' | 'urgente' | 'check_up';
  scheduledFor: string;
  chiefComplaint?: string;
}

export class ConsultationService {
  // Criar consulta no marketplace (leilão reverso)
  async createMarketplaceConsultation(data: CreateMarketplaceConsultationData) {
    const result = await queries.createMarketplaceConsultation({
      patientId: data.patientId,
      consultationType: data.consultationType,
      patientOffer: data.patientOffer,
      chiefComplaint: data.chiefComplaint,
      scheduledFor: data.scheduledFor,
    });

    return result[0];
  }

  // Criar agendamento direto (consultório virtual)
  async createDirectConsultation(data: CreateDirectConsultationData) {
    // Buscar preço do médico
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, data.doctorId))
      .limit(1);

    if (!doctor) {
      throw new Error('Médico não encontrado');
    }

    // Verificar se o médico aceita consultas diretas
    if (doctor.accountType === 'marketplace') {
      throw new Error('Este médico só aceita consultas via marketplace');
    }

    // Pegar preço baseado no tipo de consulta
    const pricing = doctor.consultationPricing as any;
    const agreedPrice = pricing?.[data.consultationType] || 0;

    // Calcular taxa da plataforma (2-5% dependendo do plano)
    const platformFeePercent = 0.05; // 5% por padrão
    const platformFee = parseFloat(agreedPrice) * platformFeePercent;
    const doctorEarnings = parseFloat(agreedPrice) - platformFee;

    const result = await queries.createDirectConsultation({
      patientId: data.patientId,
      doctorId: data.doctorId,
      consultationType: data.consultationType,
      scheduledFor: data.scheduledFor,
      agreedPrice: agreedPrice.toString(),
      platformFee: platformFee.toFixed(2),
      doctorEarnings: doctorEarnings.toFixed(2),
      chiefComplaint: data.chiefComplaint,
    });

    return result[0];
  }

  // Listar consultas do paciente
  async getPatientConsultations(patientId: number) {
    return await queries.getPatientConsultations(patientId);
  }

  // Listar consultas do médico
  async getDoctorConsultations(doctorId: number) {
    return await queries.getDoctorConsultations(doctorId);
  }

  // Buscar consulta por ID
  async getConsultationById(consultationId: number) {
    const [consultation] = await db
      .select({
        consultation: consultations,
        patient: patients,
        patientUser: users,
        doctor: doctors,
        doctorUser: users,
      })
      .from(consultations)
      .innerJoin(patients, eq(consultations.patientId, patients.id))
      .innerJoin(users, eq(patients.userId, users.id))
      .leftJoin(doctors, eq(consultations.doctorId, doctors.id))
      .leftJoin(
        { doctorUser: users },
        eq(doctors.userId, users.id)
      )
      .where(eq(consultations.id, consultationId))
      .limit(1);

    if (!consultation) {
      throw new Error('Consulta não encontrada');
    }

    return {
      ...consultation.consultation,
      patient: {
        id: consultation.patient.id,
        fullName: consultation.patientUser.fullName,
        phone: consultation.patientUser.phone,
      },
      doctor: consultation.doctor ? {
        id: consultation.doctor.id,
        fullName: consultation.doctorUser?.fullName,
        crm: consultation.doctor.crm,
        specialties: consultation.doctor.specialties,
      } : null,
    };
  }

  // Atualizar consulta
  async updateConsultation(consultationId: number, data: any) {
    const [updated] = await db
      .update(consultations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, consultationId))
      .returning();

    if (!updated) {
      throw new Error('Consulta não encontrada');
    }

    return updated;
  }

  // Cancelar consulta
  async cancelConsultation(consultationId: number, reason: string) {
    const [cancelled] = await db
      .update(consultations)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, consultationId))
      .returning();

    if (!cancelled) {
      throw new Error('Consulta não encontrada');
    }

    return cancelled;
  }

  // Iniciar consulta
  async startConsultation(consultationId: number, meetingUrl: string) {
    const [started] = await db
      .update(consultations)
      .set({
        status: 'in_progress',
        meetingUrl,
        meetingStartedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, consultationId))
      .returning();

    if (!started) {
      throw new Error('Consulta não encontrada');
    }

    return started;
  }

  // Finalizar consulta
  async completeConsultation(
    consultationId: number,
    data: {
      clinicalNotes?: string;
      diagnosis?: string;
      prescription?: any;
    }
  ) {
    const [completed] = await db
      .update(consultations)
      .set({
        status: 'completed',
        meetingEndedAt: new Date(),
        completedAt: new Date(),
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, consultationId))
      .returning();

    if (!completed) {
      throw new Error('Consulta não encontrada');
    }

    return completed;
  }

  // Avaliar consulta (paciente avalia médico)
  async rateConsultation(
    consultationId: number,
    rating: number,
    feedback?: string
  ) {
    const [rated] = await db
      .update(consultations)
      .set({
        patientRating: rating,
        patientFeedback: feedback,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, consultationId))
      .returning();

    if (!rated) {
      throw new Error('Consulta não encontrada');
    }

    // Atualizar rating médio do médico
    if (rated.doctorId) {
      await this.updateDoctorRating(rated.doctorId);
    }

    return rated;
  }

  // Atualizar rating médio do médico
  private async updateDoctorRating(doctorId: number) {
    const completedConsultations = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          eq(consultations.status, 'completed')
        )
      );

    const ratingsWithValues = completedConsultations.filter(
      (c) => c.patientRating !== null
    );

    if (ratingsWithValues.length > 0) {
      const avgRating =
        ratingsWithValues.reduce((sum, c) => sum + (c.patientRating || 0), 0) /
        ratingsWithValues.length;

      await db
        .update(doctors)
        .set({
          rating: avgRating.toFixed(2),
          totalConsultations: completedConsultations.length,
        })
        .where(eq(doctors.id, doctorId));
    }
  }

  // Buscar consultas pendentes do marketplace
  async getPendingMarketplaceConsultations() {
    return await db
      .select({
        consultation: consultations,
        patient: patients,
        patientUser: users,
      })
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
}

export default new ConsultationService();

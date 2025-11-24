import { db } from '../../db';
import { patients, users, patientDoctorRelationships, doctors } from '../../db/schema';
import { eq } from 'drizzle-orm';
import queries from '../../db/queries';

export class PatientService {
  // Buscar perfil do paciente
  async getPatientProfile(userId: number) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);

    if (!patient) {
      throw new Error('Perfil de paciente não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      cpf: user.cpf,
      profileImage: user.profileImage,
      patient: {
        id: patient.id,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        medicalHistory: patient.medicalHistory,
        emergencyContact: patient.emergencyContact,
      },
    };
  }

  // Atualizar perfil do paciente
  async updatePatientProfile(userId: number, data: any) {
    // Atualizar dados do user
    if (data.fullName || data.phone || data.cpf) {
      await db
        .update(users)
        .set({
          ...(data.fullName && { fullName: data.fullName }),
          ...(data.phone && { phone: data.phone }),
          ...(data.cpf && { cpf: data.cpf }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    // Atualizar dados específicos do paciente
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);

    if (!patient) {
      throw new Error('Perfil de paciente não encontrado');
    }

    const [updated] = await db
      .update(patients)
      .set({
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.gender && { gender: data.gender }),
        ...(data.address && { address: data.address }),
        ...(data.medicalHistory && { medicalHistory: data.medicalHistory }),
        ...(data.emergencyContact && { emergencyContact: data.emergencyContact }),
      })
      .where(eq(patients.userId, userId))
      .returning();

    return updated;
  }

  // Buscar consultas do paciente
  async getPatientConsultations(patientId: number) {
    return await queries.getPatientConsultations(patientId);
  }

  // Buscar médicos do paciente (consultório)
  async getPatientDoctors(patientId: number) {
    const relationships = await db
      .select({
        relationship: patientDoctorRelationships,
        doctor: doctors,
        doctorUser: users,
      })
      .from(patientDoctorRelationships)
      .innerJoin(doctors, eq(patientDoctorRelationships.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(patientDoctorRelationships.patientId, patientId));

    return relationships.map((rel) => ({
      relationshipId: rel.relationship.id,
      isPrimaryDoctor: rel.relationship.isPrimaryDoctor,
      firstConsultationDate: rel.relationship.firstConsultationDate,
      lastConsultationDate: rel.relationship.lastConsultationDate,
      totalConsultations: rel.relationship.totalConsultations,
      doctor: {
        id: rel.doctor.id,
        fullName: rel.doctorUser.fullName,
        crm: rel.doctor.crm,
        crmState: rel.doctor.crmState,
        specialties: rel.doctor.specialties,
        rating: rel.doctor.rating,
        customUrl: rel.doctor.customUrl,
      },
    }));
  }

  // Buscar dashboard do paciente
  async getPatientDashboard(patientId: number) {
    return await queries.getPatientDashboard(patientId);
  }

  // Adicionar médico aos favoritos
  async addFavoriteDoctor(patientId: number, doctorId: number) {
    // Verificar se já existe relacionamento
    const existing = await db
      .select()
      .from(patientDoctorRelationships)
      .where(
        eq(patientDoctorRelationships.patientId, patientId) &&
        eq(patientDoctorRelationships.doctorId, doctorId)
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Criar relacionamento
    const [relationship] = await db
      .insert(patientDoctorRelationships)
      .values({
        patientId,
        doctorId,
      })
      .returning();

    return relationship;
  }

  // Remover médico dos favoritos
  async removeFavoriteDoctor(patientId: number, doctorId: number) {
    await db
      .delete(patientDoctorRelationships)
      .where(
        eq(patientDoctorRelationships.patientId, patientId) &&
        eq(patientDoctorRelationships.doctorId, doctorId)
      );

    return { success: true };
  }
}

export default new PatientService();

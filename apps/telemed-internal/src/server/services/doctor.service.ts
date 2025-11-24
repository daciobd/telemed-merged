import { db } from '../../db';
import { doctors, users, virtualOfficeSettings } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import queries from '../../db/queries';

export class DoctorService {
  // Listar todos os médicos ativos
  async getAllDoctors(filters?: { specialty?: string; accountType?: string }) {
    let query = db
      .select({
        id: doctors.id,
        userId: doctors.userId,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        profileImage: users.profileImage,
        crm: doctors.crm,
        crmState: doctors.crmState,
        specialties: doctors.specialties,
        accountType: doctors.accountType,
        customUrl: doctors.customUrl,
        bio: doctors.bio,
        rating: doctors.rating,
        totalConsultations: doctors.totalConsultations,
        isVerified: doctors.isVerified,
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.isActive, true));

    // Filtro por especialidade
    if (filters?.specialty) {
      query = query.where(
        sql`${doctors.specialties} @> ${JSON.stringify([filters.specialty])}`
      );
    }

    // Filtro por tipo de conta
    if (filters?.accountType) {
      query = query.where(eq(doctors.accountType, filters.accountType as any));
    }

    const result = await query;
    return result;
  }

  // Listar médicos do marketplace
  async getMarketplaceDoctors(specialty?: string) {
    return await queries.getMarketplaceDoctors(specialty);
  }

  // Listar médicos com consultório virtual
  async getVirtualOfficeDoctors() {
    return await queries.getVirtualOfficeDoctors();
  }

  // Buscar médico por ID
  async getDoctorById(doctorId: number) {
    const [doctor] = await db
      .select({
        id: doctors.id,
        userId: doctors.userId,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        profileImage: users.profileImage,
        crm: doctors.crm,
        crmState: doctors.crmState,
        specialties: doctors.specialties,
        accountType: doctors.accountType,
        monthlyPlan: doctors.monthlyPlan,
        customUrl: doctors.customUrl,
        consultationPricing: doctors.consultationPricing,
        bio: doctors.bio,
        education: doctors.education,
        experience: doctors.experience,
        availability: doctors.availability,
        consultationDuration: doctors.consultationDuration,
        rating: doctors.rating,
        totalConsultations: doctors.totalConsultations,
        isVerified: doctors.isVerified,
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.id, doctorId))
      .limit(1);

    if (!doctor) {
      throw new Error('Médico não encontrado');
    }

    return doctor;
  }

  // Atualizar perfil do médico
  async updateDoctorProfile(doctorId: number, data: any) {
    // Verificar se customUrl já existe (se estiver sendo alterado)
    if (data.customUrl) {
      const isAvailable = await queries.isCustomUrlAvailable(data.customUrl);
      
      // Verificar se não é a URL do próprio médico
      const [currentDoctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.id, doctorId))
        .limit(1);

      if (!isAvailable && currentDoctor.customUrl !== data.customUrl) {
        throw new Error('URL já está em uso');
      }
    }

    // Atualizar dados do médico
    const [updated] = await db
      .update(doctors)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, doctorId))
      .returning();

    // Atualizar nome no users se fornecido
    if (data.fullName) {
      await db
        .update(users)
        .set({
          fullName: data.fullName,
          updatedAt: new Date(),
        })
        .where(eq(users.id, updated.userId));
    }

    return updated;
  }

  // Buscar médico por customUrl
  async getDoctorByCustomUrl(customUrl: string) {
    const result = await queries.getDoctorByCustomUrl(customUrl);

    if (!result || result.length === 0) {
      throw new Error('Consultório não encontrado');
    }

    const doctor = result[0];

    // Buscar configurações do consultório virtual se aplicável
    let officeSettings = null;
    if (
      doctor.doctors.accountType === 'virtual_office' ||
      doctor.doctors.accountType === 'hybrid'
    ) {
      const settings = await queries.getVirtualOfficeSettings(doctor.doctors.id);
      officeSettings = settings[0] || null;
    }

    return {
      ...doctor.doctors,
      user: doctor.users,
      officeSettings,
    };
  }

  // Verificar disponibilidade de URL
  async checkUrlAvailability(customUrl: string) {
    return await queries.isCustomUrlAvailable(customUrl);
  }

  // Buscar médicos (search)
  async searchDoctors(searchTerm: string) {
    return await queries.searchDoctors(searchTerm);
  }
}

export default new DoctorService();

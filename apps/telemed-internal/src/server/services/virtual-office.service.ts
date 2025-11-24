import { db } from '../../db';
import { virtualOfficeSettings, doctors, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import queries from '../../db/queries';

export class VirtualOfficeService {
  // Buscar configurações do consultório
  async getSettings(doctorId: number) {
    const settings = await queries.getVirtualOfficeSettings(doctorId);

    if (!settings || settings.length === 0) {
      // Criar configurações padrão se não existir
      const [newSettings] = await db
        .insert(virtualOfficeSettings)
        .values({
          doctorId,
        })
        .returning();

      return newSettings;
    }

    return settings[0];
  }

  // Atualizar configurações do consultório
  async updateSettings(doctorId: number, data: any) {
    const updated = await queries.updateVirtualOfficeSettings(doctorId, {
      ...data,
      updatedAt: new Date(),
    });

    if (!updated || updated.length === 0) {
      throw new Error('Configurações não encontradas');
    }

    return updated[0];
  }

  // Buscar agenda do médico
  async getSchedule(doctorId: number, startDate: Date, endDate: Date) {
    return await queries.getDoctorSchedule(doctorId, startDate, endDate);
  }

  // Buscar pacientes do consultório
  async getMyPatients(doctorId: number) {
    return await queries.getDoctorPatients(doctorId);
  }

  // Buscar página pública do médico (por customUrl)
  async getPublicPage(customUrl: string) {
    const result = await queries.getDoctorByCustomUrl(customUrl);

    if (!result || result.length === 0) {
      throw new Error('Consultório não encontrado');
    }

    const doctorData = result[0];

    // Buscar configurações do consultório
    let officeSettings = null;
    if (
      doctorData.doctors.accountType === 'virtual_office' ||
      doctorData.doctors.accountType === 'hybrid'
    ) {
      const settings = await this.getSettings(doctorData.doctors.id);
      officeSettings = settings;
    }

    return {
      doctor: {
        id: doctorData.doctors.id,
        fullName: doctorData.users.fullName,
        crm: doctorData.doctors.crm,
        crmState: doctorData.doctors.crmState,
        specialties: doctorData.doctors.specialties,
        bio: doctorData.doctors.bio,
        education: doctorData.doctors.education,
        experience: doctorData.doctors.experience,
        rating: doctorData.doctors.rating,
        totalConsultations: doctorData.doctors.totalConsultations,
        isVerified: doctorData.doctors.isVerified,
        consultationPricing: doctorData.doctors.consultationPricing,
        availability: doctorData.doctors.availability,
        consultationDuration: doctorData.doctors.consultationDuration,
      },
      officeSettings: officeSettings ? {
        welcomeMessage: officeSettings.welcomeMessage,
        bookingInstructions: officeSettings.bookingInstructions,
        customBranding: officeSettings.customBranding,
        allowCancellation: officeSettings.allowCancellation,
        cancellationHours: officeSettings.cancellationHours,
      } : null,
    };
  }

  // Verificar disponibilidade de horário
  async checkAvailability(doctorId: number, datetime: Date) {
    const startOfDay = new Date(datetime);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(datetime);
    endOfDay.setHours(23, 59, 59, 999);

    const schedule = await this.getSchedule(doctorId, startOfDay, endOfDay);

    // Verificar se já existe consulta no mesmo horário
    const hasConflict = schedule.some((consultation: any) => {
      const consultationTime = new Date(consultation.scheduledFor);
      return consultationTime.getTime() === datetime.getTime();
    });

    return !hasConflict;
  }
}

export default new VirtualOfficeService();

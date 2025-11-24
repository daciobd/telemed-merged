import { apiRequest } from '@/lib/api';
import type { PublicDoctorPage, TimeSlot, BookingData, Consultation } from '@/types/doctor.types';

export const virtualOfficeService = {
  // Buscar página pública do consultório
  async getPublicPage(customUrl: string): Promise<PublicDoctorPage> {
    const data = await apiRequest<PublicDoctorPage>(`/api/consultorio/dr/${customUrl}`);
    return data;
  },

  // Verificar disponibilidade de horário
  async checkAvailability(doctorId: number, datetime: string): Promise<{ available: boolean }> {
    const data = await apiRequest<{ available: boolean }>('/api/consultorio/virtual-office/check-availability', {
      method: 'POST',
      body: JSON.stringify({ doctorId, datetime }),
    });
    return data;
  },

  // Criar agendamento direto
  async createDirectBooking(bookingData: BookingData): Promise<Consultation> {
    const data = await apiRequest<Consultation>('/api/consultorio/consultations/direct', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
    return data;
  },

  // Buscar horários disponíveis do médico
  async getAvailableSlots(
    doctorId: number,
    date: string,
    duration: number = 30
  ): Promise<TimeSlot[]> {
    // Gera slots de horários baseado na disponibilidade
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8h
    const endHour = 18; // 18h
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += duration) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const datetime = `${date}T${time}:00`;
        
        slots.push({
          datetime,
          available: true, // Será verificado pelo backend se necessário
        });
      }
    }
    
    return slots;
  },
};

export default virtualOfficeService;

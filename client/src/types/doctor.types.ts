// Types para consultório virtual e agendamento

export interface Doctor {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  crm: string;
  crmState: string;
  specialties: string[];
  bio?: string;
  profileImage?: string;
  customUrl?: string;
  rating?: string;
  totalConsultations?: number;
  accountType: 'marketplace' | 'virtual_office' | 'hybrid';
  consultationPricing?: {
    primeira_consulta?: number;
    retorno?: number;
    urgente?: number;
    check_up?: number;
  };
  availability?: {
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };
  consultationDuration?: number;
}

export interface VirtualOfficeSettings {
  id: number;
  doctorId: number;
  customUrl: string;
  autoAcceptBookings: boolean;
  requirePrepayment: boolean;
  allowCancellation: boolean;
  cancellationHours?: number;
  customBranding?: {
    primaryColor?: string;
    logo?: string;
    coverImage?: string;
  };
  welcomeMessage?: string;
  bookingInstructions?: string;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}

export interface PublicDoctorPage {
  doctor: Doctor;
  officeSettings: VirtualOfficeSettings;
}

export interface TimeSlot {
  datetime: string;
  available: boolean;
}

export interface BookingData {
  doctorId: number;
  consultationType: 'primeira_consulta' | 'retorno' | 'urgente' | 'check_up';
  scheduledFor: string;
  chiefComplaint?: string;
}

export interface Consultation {
  id: number;
  patientId: number;
  doctorId: number;
  consultationType: string;
  status: string;
  scheduledFor: string;
  agreedPrice: string;
  meetingUrl?: string;
  createdAt: string;
}

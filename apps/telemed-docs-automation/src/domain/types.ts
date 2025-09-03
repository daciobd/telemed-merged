export type CID = string; // e.g., 'J02.9'

export type ConsultationSummary = {
  consultationId: string;
  patient: {
    id: string;
    name: string;
    email?: string;
    phone?: string; // E.164
    birthDate?: string; // ISO
    allergies?: string[];
    chronicConditions?: string[];
    currentMeds?: string[];
  };
  clinician: {
    id: string;
    name: string;
    crm: string;
    specialty?: string;
  };
  vitals?: Record<string, string | number>;
  complaints?: string;
  findings?: string;
  assessment?: string; // free text from the doctor/IA
  suggestedCid?: CID;
  plan?: string;
  timestamp: string; // ISO
};

export type PrescriptionItem = {
  drug: string; // e.g., Amoxicilina 500mg
  dose: string; // 1 cápsula
  route: string; // VO
  frequency: string; // 8/8h
  duration: string; // 7 dias
  notes?: string;
};

export type PrescriptionPayload = {
  type: 'prescription';
  items: PrescriptionItem[];
  obs?: string;
};

export type AttestationPayload = {
  type: 'attestation';
  reason: string; // Ex.: virose / lombalgia / etc.
  startDate: string; // ISO
  daysOff: number;
  restrictions?: string; // se aplicável
};

export type GeneratedDoc = {
  id: string;
  kind: 'prescription' | 'attestation';
  pdfPath: string; // local path on server
  filename: string;
  metadata: Record<string, string>;
};
import { ids } from '@/lib/ids';

export function onSignupSuccess(patientId: string){
  ids.setPatientId(patientId);
  window.location.href = `/paciente/cadastro/sucesso?patientId=${encodeURIComponent(patientId)}`;
}
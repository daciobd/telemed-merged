export const ids = {
  getPatientId(): string { return localStorage.getItem('patientId') || ''; },
  setPatientId(id: string) { localStorage.setItem('patientId', id); },
  getAppointmentId(): string { return localStorage.getItem('appointmentId') || ''; },
  setAppointmentId(id: string) { localStorage.setItem('appointmentId', id); },
};
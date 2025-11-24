import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import virtualOfficeService from '@/lib/virtualOffice';
import type { PublicDoctorPage, TimeSlot } from '@/types/doctor.types';

export default function PublicOfficePage() {
  const { customUrl } = useParams<{ customUrl: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [doctorData, setDoctorData] = useState<PublicDoctorPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<string>(''); // Tipos dinâmicos baseados no pricing
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    loadDoctorPage();
  }, [customUrl]);

  const loadDoctorPage = async () => {
    if (!customUrl) return;

    try {
      setIsLoading(true);
      const data = await virtualOfficeService.getPublicPage(customUrl);
      setDoctorData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Médico não encontrado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingClick = () => {
    if (!isAuthenticated) {
      setLocation('/login', { state: { returnTo: `/dr/${customUrl}` } });
      return;
    }

    if (user?.role !== 'patient') {
      alert('Apenas pacientes podem agendar consultas');
      return;
    }

    setShowBookingModal(true);
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');

    if (doctorData) {
      const slots = await virtualOfficeService.getAvailableSlots(
        doctorData.doctor.id,
        date,
        doctorData.doctor.consultationDuration || 30
      );
      setAvailableSlots(slots);
    }
  };

  const handleBooking = async () => {
    if (!doctorData || !selectedDate || !selectedTime) {
      alert('Selecione data e horário');
      return;
    }

    setIsBooking(true);

    try {
      await virtualOfficeService.createDirectBooking({
        doctorId: doctorData.doctor.id,
        consultationType,
        scheduledFor: `${selectedDate}T${selectedTime}:00`,
        chiefComplaint,
      });

      alert('Consulta agendada com sucesso!');
      setShowBookingModal(false);
      setLocation('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao agendar consulta');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !doctorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Consultório não encontrado</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => setLocation('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  const { doctor, officeSettings } = doctorData;
  const pricing = doctor.consultationPricing || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Cover */}
      <div 
        className="relative h-64 bg-gradient-to-r from-indigo-600 to-purple-600"
        style={{
          backgroundImage: officeSettings.customBranding?.coverImage 
            ? `url(${officeSettings.customBranding.coverImage})` 
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-5xl mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex items-end gap-6">
            {/* Profile Image */}
            <div className="w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border-4 border-white">
              {doctor.profileImage ? (
                <img src={doctor.profileImage} alt={doctor.fullName} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>

            {/* Doctor Info */}
            <div className="text-white pb-2">
              <h1 className="text-3xl font-bold mb-2">{doctor.fullName}</h1>
              <p className="text-lg text-white/90">CRM {doctor.crm}/{doctor.crmState}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Specialties */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Especialidades</h2>
              <div className="flex flex-wrap gap-2">
                {doctor.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Welcome Message */}
            {officeSettings.welcomeMessage && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Mensagem de Boas-Vindas</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {officeSettings.welcomeMessage}
                </p>
              </div>
            )}

            {/* About */}
            {doctor.bio && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Sobre</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {doctor.bio}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Estatísticas</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">
                    {doctor.totalConsultations || 0}
                  </div>
                  <div className="text-sm text-gray-600">Consultas Realizadas</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">
                    {doctor.rating || '5.0'}
                    <span className="text-lg">⭐</span>
                  </div>
                  <div className="text-sm text-gray-600">Avaliação</div>
                </div>
              </div>
            </div>

            {/* Booking Instructions */}
            {officeSettings.bookingInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Instruções para Agendamento</h3>
                <p className="text-blue-800 text-sm whitespace-pre-wrap">
                  {officeSettings.bookingInstructions}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Agendar Consulta</h2>

              {/* Pricing */}
              <div className="space-y-3 mb-6">
                {pricing.primeira_consulta && (
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-700">Primeira Consulta</span>
                    <span className="font-bold text-indigo-600">
                      R$ {pricing.primeira_consulta}
                    </span>
                  </div>
                )}
                {pricing.retorno && (
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-700">Retorno</span>
                    <span className="font-bold text-indigo-600">
                      R$ {pricing.retorno}
                    </span>
                  </div>
                )}
                {pricing.urgente && (
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-700">Urgente</span>
                    <span className="font-bold text-indigo-600">
                      R$ {pricing.urgente}
                    </span>
                  </div>
                )}
              </div>

              {/* Duration */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Duração: {doctor.consultationDuration || 30} minutos</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleBookingClick}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
              >
                Agendar Agora
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                {officeSettings.requirePrepayment 
                  ? '💳 Pagamento antecipado necessário' 
                  : '✅ Pagamento após consulta'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Agendar Consulta</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Tipo de Consulta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Consulta
                </label>
                <select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione o tipo</option>
                  {Object.entries(pricing).map(([type, price]) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} - R$ {price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Horários */}
              {selectedDate && availableSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário Disponível
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {availableSlots.map((slot) => {
                      const time = slot.datetime.split('T')[1].substring(0, 5);
                      return (
                        <button
                          key={slot.datetime}
                          onClick={() => setSelectedTime(time)}
                          disabled={!slot.available}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            selectedTime === time
                              ? 'bg-indigo-600 text-white'
                              : slot.available
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Queixa Principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Queixa Principal (opcional)
                </label>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Descreva brevemente o motivo da consulta..."
                />
              </div>

              {/* Botões */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || isBooking}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBooking ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

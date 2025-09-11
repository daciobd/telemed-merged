import { env } from '@/lib/env';
import { ids } from '@/lib/ids';
import { useSearchParams } from 'react-router-dom';

export default function ConsultaSala() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') || ids.getAppointmentId();
  const patientId = searchParams.get('patientId') || ids.getPatientId();
  const doctorId = 'demo-doctor'; // Pode vir de contexto de auth

  const mdaUrl = env.MDA_BASE
    ? `${env.MDA_BASE}/?patientId=${encodeURIComponent(patientId)}&appointmentId=${encodeURIComponent(appointmentId)}`
    : '';

  const rcBase = import.meta.env.VITE_RC_BASE_URL;
  const urlRC = `${rcBase}?appointmentId=${encodeURIComponent(appointmentId)}&patientId=${encodeURIComponent(patientId)}&doctorId=${encodeURIComponent(doctorId)}`;

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header da consulta */}
        <div className="bg-white rounded-lg p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              👤
            </div>
            <div>
              <h2 className="font-semibold">Consulta Médica</h2>
              <p className="text-sm text-slate-600">ID: {appointmentId}</p>
            </div>
          </div>
          
          {/* Botões de integração */}
          <div className="flex gap-3">
            {env.MDA_BASE && (
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => window.open(mdaUrl, '_blank', 'noopener')}
                data-testid="button-open-mda"
              >
                🖥️ Abrir Medical Desk
              </button>
            )}
            {rcBase && (
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                onClick={() => window.open(urlRC, "_blank", "noopener")}
                data-testid="button-open-receita-certa"
              >
                📋 Abrir ReceitaCerta
              </button>
            )}
          </div>
        </div>

        {/* Área de vídeo */}
        <div className="bg-slate-800 rounded-lg aspect-video mb-6 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">📹</div>
            <p>Área de videochamada</p>
            <p className="text-sm text-slate-300">Integração com Jitsi ou outro provider</p>
          </div>
        </div>

        {/* Painel lateral para anotações */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Notas da Consulta</h3>
          <textarea 
            className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none"
            placeholder="Digite suas anotações da consulta..."
          />
          <div className="flex gap-3 mt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              💾 Salvar
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              ✅ Finalizar Consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
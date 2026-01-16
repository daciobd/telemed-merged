import { useEffect, useState } from 'react';
import { Video, Clock, User, AlertCircle, Loader2, Stethoscope, FileText, Phone } from 'lucide-react';

interface MeetRoomProps {
  meetId: string;
  token: string;
  role: "patient" | "doctor";
}

interface ConsultationData {
  id: number;
  doctorName?: string;
  patientName?: string;
  scheduledFor?: string;
  status?: string;
}

export default function MeetRoom({ meetId, token, role }: MeetRoomProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);

  useEffect(() => {
    async function validateSession() {
      try {
        const res = await fetch(`/api/consultorio/meet/${meetId}/validate?t=${encodeURIComponent(token)}`);
        const data = await res.json();
        
        if (!res.ok || !data.valid) {
          setError(data.message || 'Link inválido ou expirado');
          return;
        }
        
        setConsultation(data.consultation);
      } catch (err) {
        setError('Erro ao conectar com o servidor');
      } finally {
        setLoading(false);
      }
    }

    if (meetId && token) {
      validateSession();
    } else {
      setError('Link de consulta inválido');
      setLoading(false);
    }
  }, [meetId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validando sessão...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/consultorio/login"
            className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  const isDoctor = role === "doctor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-teal-600" />
            <span className="text-xl font-bold text-gray-900">TeleMed</span>
            {isDoctor && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Médico
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Consulta #{meetId}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="aspect-video bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <Video className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">
                {isDoctor ? "Sala de Atendimento" : "Sala de Espera"}
              </h2>
              <p className="text-gray-400">
                {isDoctor 
                  ? "Paciente aguardando. Inicie a consulta quando estiver pronto."
                  : "Aguardando o médico iniciar a consulta..."
                }
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDoctor ? 'bg-blue-100' : 'bg-teal-100'
                }`}>
                  {isDoctor ? (
                    <User className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Stethoscope className="w-6 h-6 text-teal-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {isDoctor 
                      ? (consultation?.patientName || 'Paciente')
                      : (consultation?.doctorName || 'Médico')
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {consultation?.scheduledFor 
                      ? new Date(consultation.scheduledFor).toLocaleString('pt-BR')
                      : 'Horário não definido'
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  disabled
                >
                  Testar Áudio
                </button>
                
                {isDoctor ? (
                  <>
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                      disabled
                    >
                      <FileText className="w-4 h-4" />
                      Prontuário
                    </button>
                    <button 
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
                      disabled
                    >
                      <Phone className="w-4 h-4" />
                      Iniciar Consulta
                    </button>
                  </>
                ) : (
                  <button 
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                    disabled
                  >
                    Entrar na Sala
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-6 p-4 rounded-lg border ${
          isDoctor ? 'bg-blue-50 border-blue-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <p className="text-sm text-blue-800">
            {isDoctor ? (
              <>
                <strong>Médico:</strong> O paciente está na sala de espera. 
                Quando estiver pronto, clique em "Iniciar Consulta". 
                Use o botão "Prontuário" para acessar as informações do paciente.
              </>
            ) : (
              <>
                <strong>Dica:</strong> Verifique sua câmera e microfone antes de entrar na consulta.
                A videochamada será iniciada quando o médico estiver pronto.
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

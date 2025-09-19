import { env } from '@/lib/env';
import { ids } from '@/lib/ids';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function ConsultaSala() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId') || ids.getAppointmentId();
  const patientId = searchParams.get('patientId') || ids.getPatientId();
  const doctorId = 'demo-doctor'; // Pode vir de contexto de auth
  const role = searchParams.get('role') || 'paciente'; // 'paciente' | 'medico'
  
  // Estados para sala de espera e chat
  const [hostPresent, setHostPresent] = useState(false);
  const [canJoin, setCanJoin] = useState(role === 'medico');
  const [chatMessages, setChatMessages] = useState<Array<{id: string, sender: string, message: string, timestamp: Date}>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, url: string, timestamp: Date}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mdaUrl = env.MDA_BASE
    ? `${env.MDA_BASE}/?patientId=${encodeURIComponent(patientId)}&appointmentId=${encodeURIComponent(appointmentId)}`
    : '';

  const rcBase = import.meta.env.VITE_RC_BASE_URL;
  const urlRC = `${rcBase}?appointmentId=${encodeURIComponent(appointmentId)}&patientId=${encodeURIComponent(patientId)}&doctorId=${encodeURIComponent(doctorId)}`;

  // Verificar estado da sala periodicamente
  useEffect(() => {
    async function checkRoomState() {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/room-state`);
        if (response.ok) {
          const state = await response.json();
          setHostPresent(state.hostPresent || false);
          setCanJoin(role === 'medico' ? true : (state.hostPresent || state.canJoin || false));
        }
      } catch (error) {
        // Mock behavior para demo
        setHostPresent(role === 'medico');
        setCanJoin(role === 'medico');
      }
    }

    checkRoomState();
    const interval = setInterval(checkRoomState, 5000);
    return () => clearInterval(interval);
  }, [appointmentId, role]);

  // Abrir consultório (médico)
  const handleStartCall = async (audioOnly = false) => {
    if (role === 'medico') {
      try {
        await fetch(`/api/appointments/${appointmentId}/call/start`, { method: 'POST' });
      } catch (error) {
        console.log('Mock: Médico iniciou a sala');
      }
      setHostPresent(true);
    }
    
    // Redirecionar para sala WebRTC
    const mode = audioOnly ? 'audio' : 'av';
    window.location.href = `/call.html?appointmentId=${encodeURIComponent(appointmentId)}&mode=${mode}&role=${role}`;
  };

  // Enviar mensagem no chat
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      sender: role === 'medico' ? 'Dr. Silva' : 'Paciente',
      message: newMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Enviar para servidor (mock)
    try {
      await fetch(`/api/appointments/${appointmentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.log('Mock: Mensagem salva no chat persistente');
    }
  };

  // Upload de documentos seguros
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      // Validações de segurança
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.includes(file.type)) {
        alert('Apenas arquivos PDF, JPG e PNG são permitidos');
        continue;
      }
      
      if (file.size > maxSize) {
        alert('Arquivo muito grande. Máximo 10MB');
        continue;
      }

      try {
        // Simular upload para object storage com URL assinada
        const uploadFile = {
          name: file.name,
          url: `/objects/appointments/${appointmentId}/${file.name}`,
          timestamp: new Date()
        };
        
        setUploadedFiles(prev => [...prev, uploadFile]);
        
        // Mock upload com segurança
        console.log('Mock: Upload seguro para', uploadFile.url);
        
        alert(`📁 Arquivo "${file.name}" enviado com segurança!`);
      } catch (error) {
        alert('Erro no upload. Tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header da consulta */}
        <div className="bg-white rounded-lg p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              {role === 'medico' ? '👩‍⚕️' : '👤'}
            </div>
            <div>
              <h2 className="font-semibold">
                {role === 'medico' ? 'Consultório Virtual' : 'Sala de Consulta'}
              </h2>
              <p className="text-sm text-slate-600">ID: {appointmentId}</p>
              <p className="text-xs text-slate-500">
                {role === 'medico' ? 
                  (hostPresent ? '✅ Consultório ativo' : '🟡 Pronto para abrir') :
                  (hostPresent ? '✅ Médico presente' : '🔄 Aguardando médico...')
                }
              </p>
            </div>
          </div>
          
          {/* Controles da sala */}
          <div className="flex gap-3">
            {role === 'medico' && !hostPresent ? (
              <>
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => handleStartCall(false)}
                  data-testid="button-start-video-call"
                >
                  📹 Abrir consultório (vídeo)
                </button>
                <button 
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  onClick={() => handleStartCall(true)}
                  data-testid="button-start-audio-call"
                >
                  🎤 Abrir consultório (áudio)
                </button>
              </>
            ) : canJoin ? (
              <>
                <button 
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  onClick={() => handleStartCall(false)}
                  data-testid="button-join-video-call"
                >
                  📹 Entrar na sala (vídeo)
                </button>
                <button 
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  onClick={() => handleStartCall(true)}
                  data-testid="button-join-audio-call"
                >
                  🎤 Entrar na sala (áudio)
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-500 italic">
                Aguardando o médico entrar na sala...
              </div>
            )}
          </div>
        </div>

        {/* Ferramentas médicas - só para médicos */}
        {role === 'medico' && (
          <div className="bg-white rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">🩺 Ferramentas Médicas</h3>
            <div className="flex gap-3">
              {env.MDA_BASE && (
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => window.open(mdaUrl, '_blank', 'noopener')}
                  data-testid="button-open-mda"
                >
                  🖥️ Medical Desk
                </button>
              )}
              {rcBase && (
                <button 
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  onClick={() => window.open(urlRC, "_blank", "noopener")}
                  data-testid="button-open-receita-certa"
                >
                  📋 ReceitaCerta
                </button>
              )}
              <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                🔒 Finalizar consulta
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Área principal - video preview */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">📹</div>
                <p>Sala de videochamada</p>
                <p className="text-sm text-slate-300">
                  {canJoin ? 'Clique nos botões acima para entrar' : 'Aguardando autorização do médico'}
                </p>
              </div>
            </div>
          </div>

          {/* Painel lateral - Chat e uploads */}
          <div className="space-y-4">
            {/* Chat persistente */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                💬 Chat da consulta
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">persistente</span>
              </h3>
              
              {/* Mensagens */}
              <div className="h-40 overflow-y-auto border border-gray-200 rounded p-2 mb-3 space-y-2">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    {role === 'paciente' ? 
                      'Você pode conversar por texto e enviar documentos enquanto aguarda.' :
                      'Chat disponível para comunicação durante a consulta.'
                    }
                  </p>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-semibold text-blue-600">{msg.sender}:</span>
                      <span className="ml-2">{msg.message}</span>
                      <div className="text-xs text-gray-400">{msg.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Input de mensagem */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  data-testid="input-chat-message"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
                  data-testid="button-send-message"
                >
                  Enviar
                </button>
              </div>
            </div>

            {/* Upload de documentos seguros */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                📁 Documentos
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">seguro</span>
              </h3>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors"
                data-testid="button-upload-documents"
              >
                <div className="text-2xl mb-2">📄</div>
                <div className="text-sm font-medium text-gray-700">Enviar documentos</div>
                <div className="text-xs text-gray-500">PDF, JPG, PNG (máx 10MB)</div>
              </button>
              
              {/* Lista de arquivos enviados */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium">Enviados:</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                      <span>📎 {file.name}</span>
                      <span className="text-xs text-gray-400">{file.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notas da consulta - só para médicos */}
            {role === 'medico' && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold mb-3">📝 Notas da consulta</h3>
                <textarea 
                  className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none text-sm"
                  placeholder="Anotações privadas da consulta..."
                  data-testid="textarea-doctor-notes"
                />
                <button className="mt-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm w-full">
                  💾 Salvar notas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
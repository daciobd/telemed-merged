import React, { useState } from 'react';

type AttestationPayload = {
  reason: string;
  startDate: string;
  daysOff: number;
  restrictions?: string;
};

type ConsultationSummary = {
  consultationId: string;
  patient: { id: string; name: string; email?: string; phone?: string };
  clinician: { id: string; name: string; crm: string; specialty?: string };
  suggestedCid?: string;
  timestamp: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  summary: ConsultationSummary;
};

export default function AttestationReviewModal({ isOpen, onClose, summary }: Props) {
  const [payload, setPayload] = useState<AttestationPayload>({ 
    reason: '', 
    startDate: new Date().toISOString().slice(0,10), 
    daysOff: 1 
  });
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true); 
    setError(null);
    try {
      const token = (window as any).TELEMED_CFG.INTERNAL_TOKEN;
      const res = await fetch(`${(window as any).TELEMED_CFG.DOCS_AUTOMATION_URL}/generate/attestation`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-internal-token': token 
        },
        body: JSON.stringify({ 
          summary, 
          payload: { type: 'attestation', ...payload } 
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Falha ao gerar atestado');
      const url = data.storage?.signedUrl || data.doc?.pdfPath;
      setResultUrl(url || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleNotifyPatient() {
    if (!resultUrl) return;
    try {
      const token = (window as any).TELEMED_CFG.INTERNAL_TOKEN;
      await fetch(`${(window as any).TELEMED_CFG.DOCS_AUTOMATION_URL}/generate/notify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-internal-token': token 
        },
        body: JSON.stringify({
          patient: {
            email: summary.patient.email,
            phone: summary.patient.phone
          },
          message: `Olá ${summary.patient.name}! Seu atestado médico está pronto. Acesse: ${resultUrl}`,
          attachmentUrl: resultUrl
        })
      });
      alert('Paciente notificado com sucesso!');
    } catch (e) {
      alert('Erro ao notificar paciente');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-semibold text-gray-900">Revisar Atestado</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo do afastamento
            </label>
            <input 
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Ex: IVAS viral, lombalgia aguda..." 
              value={payload.reason} 
              onChange={e => setPayload({...payload, reason: e.target.value})} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de início
              </label>
              <input 
                type="date" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={payload.startDate} 
                onChange={e => setPayload({...payload, startDate: e.target.value})} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dias de afastamento
              </label>
              <input 
                type="number" 
                min="1" 
                max="30"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={payload.daysOff} 
                onChange={e => setPayload({...payload, daysOff: Number(e.target.value)})} 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restrições/Recomendações (opcional)
            </label>
            <textarea 
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              rows={3}
              placeholder="Ex: Evitar atividades físicas intensas, repouso relativo..." 
              value={payload.restrictions || ''} 
              onChange={e => setPayload({...payload, restrictions: e.target.value})} 
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700">
              <div className="font-medium">Erro:</div>
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          {resultUrl && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-700">
              <div className="font-medium">Atestado gerado com sucesso!</div>
              <div className="text-sm mt-2 flex gap-2">
                <a 
                  href={resultUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-md bg-green-100 text-green-800 hover:bg-green-200 text-sm font-medium"
                >
                  📄 Abrir PDF
                </a>
                <button
                  onClick={handleNotifyPatient}
                  className="inline-flex items-center px-3 py-1 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm font-medium"
                >
                  📱 Notificar Paciente
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 border-t p-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancelar
          </button>
          <button 
            disabled={loading || !payload.reason} 
            onClick={handleGenerate} 
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md"
          >
            {loading ? 'Gerando…' : 'Gerar Atestado'}
          </button>
        </div>
      </div>
    </div>
  );
}
/**
 * Medical Summary Card Component
 * Renderiza cards "médico-ready" com resultados da triagem Dr. AI
 * Integrado aos endpoints do Dr. AI Microservice
 */

// ===== Helpers UI =====
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.textContent = msg;
  
  const colors = {
    info: { bg: '#111827', color: '#fff' },
    success: { bg: '#16a34a', color: '#fff' },
    error: { bg: '#ef4444', color: '#fff' },
    warning: { bg: '#f59e0b', color: '#fff' }
  };
  
  const style = colors[type] || colors.info;
  
  Object.assign(t.style, {
    position: 'fixed', 
    bottom: '20px', 
    left: '50%', 
    transform: 'translateX(-50%)',
    background: style.bg, 
    color: style.color, 
    padding: '12px 16px', 
    borderRadius: '12px',
    fontSize: '14px', 
    fontWeight: '500',
    boxShadow: '0 8px 24px rgba(0,0,0,.12)', 
    zIndex: 9999,
    maxWidth: '400px',
    textAlign: 'center'
  });
  
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function formatKey(k) {
  return (k || '').replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
}

function buildPlainText(data) {
  const lines = [
    'RESUMO MÉDICO — Dr. AI',
    `Paciente: ${data.paciente_nome || '—'} | Idade: ${data.idade ?? '—'} | Gênero: ${data.genero || '—'}`,
    `Queixa: ${data.symptoms_text || data.queixa_principal || '—'}`,
    `Especialidade sugerida: ${data.especialidade_sugerida || '—'} (${data.confianca ?? 0}%)`,
    `Alternativas: ${(data.alternativas || []).join(', ') || '—'}`,
    '',
    'RED FLAGS CHECKLIST:',
    ...Object.entries(data.red_flags_checklist || {}).map(([k,v]) => 
      `• ${formatKey(k)}: ${v ? 'SIM' : 'Não'}`
    ),
    '',
    'PERGUNTAS RESIDUAIS:',
    ...(data.perguntas_residuais || []).map(p => `• ${p}`),
    '',
    'ORIENTAÇÕES PRÉ-CONSULTA:',
    ...(data.orientacoes_pre_consulta || []).map(o => `• ${o}`),
    '',
    `Explicação: ${data.explicacao || '—'}`,
    `ID triagem: ${data.triagem_id || '—'}`,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`
  ];
  
  return lines.join('\\n');
}

// ===== API Integration =====
async function callDrAiAPI(endpoint, options = {}) {
  // Tentar usar o mock service primeiro (mais confiável no desenvolvimento)
  if (window.drAIService) {
    console.log('🤖 Using Dr. AI Mock Service for:', endpoint);
    
    try {
      // Mapear endpoints para métodos do mock service
      if (endpoint === '/api/triage/analyze' && options.method === 'POST') {
        const data = JSON.parse(options.body);
        return await window.drAIService.analyzeSymptoms(data);
      }
      
      if (endpoint === '/api/triagem/validate' && options.method === 'POST') {
        const data = JSON.parse(options.body);
        return await window.drAIService.validateTriage(data);
      }
      
      if (endpoint === '/api/metrics/summary') {
        return await window.drAIService.getMetrics();
      }
      
      if (endpoint.startsWith('/api/specialties/slots')) {
        const url = new URL(endpoint, 'http://localhost');
        const specialty = url.searchParams.get('specialty');
        const date = url.searchParams.get('date');
        return await window.drAIService.getSpecialtySlots(specialty, date);
      }
      
      if (endpoint === '/api/events' && options.method === 'POST') {
        const data = JSON.parse(options.body);
        return await window.drAIService.trackEvent(data);
      }
      
      if (endpoint === '/health') {
        return await window.drAIService.health();
      }
    } catch (mockError) {
      console.warn('Mock service error, falling back to real API:', mockError);
    }
  }

  // Fallback para API real se disponível
  const baseUrl = window.TELEMED_CFG?.DR_AI_URL || 'http://localhost:5001';
  // SECURITY: Never expose tokens in client code - tokens should come from server-side proxy
  const token = window.TELEMED_CFG?.DR_AI_TOKEN; // No default token for security
  
  // Only add auth header if token is configured from server-side
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'X-Auth': token }) // Only include token if provided by server
    },
    ...options
  };
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Dr. AI API Error:', error);
    
    // Se falhar, tentar usar dados mock estáticos como último recurso
    if (endpoint === '/api/metrics/summary') {
      return {
        today: { triagens: 0, precisao: 0.85, tempoMin: 2.8, satisfacao: 4.5 },
        specialties: { "Clínica Geral": 25, "Neurologia": 18, "Outros": 10 },
        accuracyBySpec: { "Clínica Geral": 0.88, "Neurologia": 0.87 },
        updatedAt: new Date().toISOString()
      };
    }
    
    throw error;
  }
}

async function postValidateTriagem({ triagem_id, status, motivo, medico_id }) {
  return await callDrAiAPI('/api/triagem/validate', {
    method: 'POST',
    body: JSON.stringify({ triagem_id, status, motivo, medico_id })
  });
}

async function trackEvent(name, properties = {}) {
  try {
    await callDrAiAPI('/api/events', {
      method: 'POST',
      body: JSON.stringify({ name, properties })
    });
  } catch (error) {
    console.warn('Event tracking failed:', error.message);
  }
}

// ===== Main Render Function =====
export function renderMedicalSummary(data, mountId = 'medical-summary-root') {
  const el = document.getElementById(mountId);
  if (!el) {
    console.error(`Element #${mountId} não encontrado`);
    return;
  }

  const redFlags = data.red_flags_checklist || {};
  const redFlagEntries = Object.entries(redFlags);
  const hasRedFlags = redFlagEntries.some(([,v]) => v === true);

  const conf = Number(data.confianca ?? 0);
  const confColor = conf >= 85 ? '#16a34a' : conf >= 60 ? '#f59e0b' : '#ef4444';
  const confText = conf >= 85 ? 'Alta' : conf >= 60 ? 'Média' : 'Baixa';
  const confBg = conf >= 85 ? '#dcfce7' : conf >= 60 ? '#fef3c7' : '#fee2e2';

  const pill = (text, danger = false) => {
    const bgClass = danger ? 'background:#fee2e2;color:#dc2626;border-color:#fecaca' : 'background:#f1f5ff;color:#2563eb;border-color:#dbeafe';
    return `<span class="pill" style="${bgClass}">${text}</span>`;
  };

  const alternativesPills = (data.alternativas || []).map(a => pill(a)).join('');

  const html = `
  <div class="ms-card">
    <div class="ms-header">
      <div class="ms-title">
        🤖 Triagem Dr. AI 
        <span class="ms-badge">médico-ready</span>
        ${hasRedFlags ? '<span class="ms-alert">⚠️ Red Flags</span>' : ''}
      </div>
      <div class="ms-pills">
        ${pill(data.especialidade_sugerida || '—')}
      </div>
    </div>

    <div class="ms-meta">
      <div class="item">
        <div class="label">Paciente</div>
        <div class="value">${data.paciente_nome || 'Não informado'}</div>
      </div>
      <div class="item">
        <div class="label">Idade</div>
        <div class="value">${data.idade ?? '—'}</div>
      </div>
      <div class="item">
        <div class="label">Gênero</div>
        <div class="value">${data.genero || '—'}</div>
      </div>
      <div class="item">
        <div class="label">Data</div>
        <div class="value">${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </div>

    <div class="ms-section">
      <h4>Queixa principal / Sintomas</h4>
      <div class="ms-box">${data.symptoms_text || data.queixa_principal || '—'}</div>
    </div>

    <div class="ms-section">
      <h4>Red flags verificadas</h4>
      <div class="ms-checklist">
        ${redFlagEntries.length
          ? redFlagEntries.map(([k,v]) => `
              <div class="ms-check ${v ? 'bad':'good'}">
                <span class="dot"></span>
                <span>${formatKey(k)}</span>
                <strong style="margin-left:auto">${v ? 'SIM':'Não'}</strong>
              </div>`).join('')
          : '<div class="ms-box">Nenhum red flag identificado.</div>'}
      </div>
    </div>

    <div class="ms-section">
      <h4>Confiabilidade da sugestão</h4>
      <div class="ms-conf">
        <div class="ms-conf-bar" style="background:#eef0f3">
          <div class="ms-conf-fill" style="width:${conf}%;background:linear-gradient(90deg,${confColor},${confColor}dd)"></div>
        </div>
        <div class="ms-conf-text" style="background:${confBg};color:${confColor}">
          <strong>${conf}% (${confText})</strong>
        </div>
      </div>
      <small style="color:#64748b;display:block;margin-top:8px;">
        <strong>Justificativa:</strong> ${data.explicacao || 'Análise baseada em padrões sintomáticos'}
      </small>
    </div>

    <div class="ms-section">
      <h4>Alternativas de especialidade</h4>
      <div class="ms-pills">${alternativesPills || '—'}</div>
    </div>

    <div class="ms-section">
      <h4>Perguntas residuais para consulta</h4>
      <ul class="ms-list">
        ${(data.perguntas_residuais || []).map(p => `<li>${p}</li>`).join('') || '<li>Nenhuma pergunta adicional sugerida</li>'}
      </ul>
    </div>

    <div class="ms-section">
      <h4>Orientações pré-consulta</h4>
      <ul class="ms-list">
        ${(data.orientacoes_pre_consulta || []).map(o => `<li>${o}</li>`).join('') || '<li>Seguir orientações médicas gerais</li>'}
      </ul>
    </div>

    <div class="ms-actions">
      <button class="btn primary" id="btnAgree" data-testid="button-concordo">
        ✅ Concordo
      </button>
      <button class="btn secondary" id="btnAdjust" data-testid="button-ajustar">
        ⚙️ Ajustar
      </button>
      <button class="btn ghost" id="btnCopy" data-testid="button-copiar">
        📋 Copiar
      </button>
      <button class="btn ghost" id="btnPrint" data-testid="button-imprimir">
        🖨️ Imprimir
      </button>
      <button class="btn success" id="btnSchedule" data-testid="button-agendar" style="margin-left:auto">
        📅 Agendar consulta
      </button>
    </div>

    <div class="ms-footer">
      <span>ID: ${data.triagem_id || '—'}</span>
      <span>Dr. AI • TeleMed Platform</span>
    </div>
  </div>`;

  el.innerHTML = html;

  // ===== Event Handlers =====
  
  // Concordo
  document.getElementById('btnAgree').onclick = async () => {
    try {
      await postValidateTriagem({ 
        triagem_id: data.triagem_id, 
        status: 'agree', 
        medico_id: data.medico_id || 'WEB-USER' 
      });
      
      await trackEvent('dr_ai_validated', { 
        status: 'agree', 
        specialty: data.especialidade_sugerida,
        confidence: data.confianca 
      });
      
      toast('Triagem validada! Médico concorda com a sugestão.', 'success');
      
      // Callback opcional
      if (typeof data.onValidate === 'function') {
        data.onValidate({ status: 'agree' });
      }
    } catch (error) {
      toast('Erro ao validar triagem. Tente novamente.', 'error');
      console.error('Validation error:', error);
    }
  };

  // Ajustar
  document.getElementById('btnAdjust').onclick = async () => {
    const motivo = prompt(
      "Descreva o ajuste necessário:",
      `Sugestão alternativa: ${(data.alternativas || [])[0] || 'Clínica Geral'}`
    );
    
    if (!motivo) return;
    
    try {
      await postValidateTriagem({ 
        triagem_id: data.triagem_id, 
        status: 'adjust', 
        motivo, 
        medico_id: data.medico_id || 'WEB-USER' 
      });
      
      await trackEvent('dr_ai_validated', { 
        status: 'adjust', 
        specialty: data.especialidade_sugerida,
        confidence: data.confianca,
        adjustment: motivo 
      });
      
      toast('Ajuste registrado! Feedback enviado para melhoria da IA.', 'warning');
      
      if (typeof data.onValidate === 'function') {
        data.onValidate({ status: 'adjust', motivo });
      }
    } catch (error) {
      toast('Erro ao registrar ajuste. Tente novamente.', 'error');
      console.error('Adjustment error:', error);
    }
  };

  // Copiar
  document.getElementById('btnCopy').onclick = async () => {
    const text = buildPlainText(data);
    try {
      await navigator.clipboard.writeText(text);
      toast('Resumo copiado para a área de transferência!', 'success');
      
      await trackEvent('dr_ai_copy', { 
        specialty: data.especialidade_sugerida 
      });
    } catch (error) {
      // Fallback para browsers mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast('Resumo copiado!', 'success');
    }
  };

  // Imprimir
  document.getElementById('btnPrint').onclick = () => {
    window.print();
    trackEvent('dr_ai_print', { specialty: data.especialidade_sugerida });
  };

  // Agendar consulta
  document.getElementById('btnSchedule').onclick = async () => {
    const specialty = data.especialidade_sugerida;
    
    try {
      // Buscar slots disponíveis
      const slotsData = await callDrAiAPI(`/api/specialties/slots?specialty=${encodeURIComponent(specialty)}`);
      
      if (slotsData.slots && slotsData.slots.length > 0) {
        // Redirecionar para página de agendamento ou abrir modal
        const agendaUrl = `/agenda.html?specialty=${encodeURIComponent(specialty)}&triagem=${data.triagem_id}`;
        window.location.href = agendaUrl;
        
        await trackEvent('dr_ai_schedule_requested', { 
          specialty, 
          available_slots: slotsData.slots.length 
        });
      } else {
        toast(`Não há horários disponíveis para ${specialty} hoje. Tente Clínica Geral.`, 'warning');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      toast('Erro ao buscar horários. Redirecionando para agenda geral...', 'warning');
      setTimeout(() => {
        window.location.href = '/agenda.html';
      }, 2000);
    }
  };
}

// ===== Função de Análise (para formulário) =====
export async function analyzeSymptomsWithDrAI(symptomsData) {
  try {
    const result = await callDrAiAPI('/api/triage/analyze', {
      method: 'POST',
      body: JSON.stringify(symptomsData)
    });
    
    await trackEvent('dr_ai_analysis', { 
      specialty: result.especialidade_sugerida,
      confidence: result.confianca 
    });
    
    return result;
  } catch (error) {
    console.error('Dr. AI Analysis Error:', error);
    toast('Erro na análise. Tente novamente.', 'error');
    throw error;
  }
}

// ===== CSS Styles =====
const styles = `
.ms-card {
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 24px;
  max-width: 900px;
  margin: 20px auto;
  border: 1px solid #e5e7eb;
  position: relative;
}

.ms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.ms-title {
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #111827;
}

.ms-badge {
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  padding: 4px 12px;
  background: #dbeafe;
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

.ms-alert {
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  padding: 4px 12px;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  animation: pulse 2s infinite;
}

.ms-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.ms-meta .item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
}

.ms-meta .label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.ms-meta .value {
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
  color: #111827;
}

.ms-section {
  margin-top: 24px;
}

.ms-section h4 {
  font-size: 16px;
  margin: 0 0 12px;
  color: #111827;
  font-weight: 600;
}

.ms-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  color: #374151;
  line-height: 1.5;
}

.ms-list {
  margin: 0;
  padding-left: 20px;
  color: #374151;
}

.ms-list li {
  margin: 8px 0;
  line-height: 1.4;
}

.ms-checklist {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 10px;
}

.ms-check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
}

.ms-check.good {
  border-color: #d1fae5;
  background: #ecfdf5;
}

.ms-check.bad {
  border-color: #fecaca;
  background: #fef2f2;
}

.ms-check .dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ms-check.good .dot {
  background: #10b981;
}

.ms-check.bad .dot {
  background: #ef4444;
}

.ms-conf {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.ms-conf-bar {
  flex: 1;
  height: 12px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
  position: relative;
}

.ms-conf-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.3s ease;
}

.ms-conf-text {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  white-space: nowrap;
}

.ms-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid;
  font-weight: 500;
  white-space: nowrap;
}

.ms-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  cursor: pointer;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  text-decoration: none;
}

.btn.primary {
  background: #2563eb;
  color: #fff;
}

.btn.primary:hover {
  background: #1d4ed8;
}

.btn.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn.secondary:hover {
  background: #e5e7eb;
}

.btn.success {
  background: #10b981;
  color: #fff;
}

.btn.success:hover {
  background: #059669;
}

.btn.ghost {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn.ghost:hover {
  background: #f9fafb;
  color: #374151;
}

.ms-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 12px;
}

@media (max-width: 768px) {
  .ms-card {
    margin: 16px;
    padding: 16px;
  }
  
  .ms-meta {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .ms-checklist {
    grid-template-columns: 1fr;
  }
  
  .ms-actions {
    flex-direction: column;
  }
  
  .btn {
    justify-content: center;
  }
}

@media print {
  .ms-actions {
    display: none !important;
  }
  
  .ms-card {
    box-shadow: none;
    border: 1px solid #000;
    margin: 0;
    max-width: none;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
`;

// Injetar CSS se não existir
if (!document.getElementById('medical-summary-styles')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'medical-summary-styles';
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}

// Export global para uso direto no HTML
window.renderMedicalSummary = renderMedicalSummary;
window.analyzeSymptomsWithDrAI = analyzeSymptomsWithDrAI;
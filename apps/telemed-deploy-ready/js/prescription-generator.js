// TeleMed Prescription Generator
// Conecta o frontend com o proxy do TeleMed para geração de receitas

class PrescriptionGenerator {
  constructor() {
    this.loadingState = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Botão "Nova Receita Memed" na aba de receitas
    const memedBtn = document.getElementById('memedBtn');
    if (memedBtn) {
      memedBtn.addEventListener('click', () => this.showPrescriptionForm());
    }
  }

  showPrescriptionForm() {
    // Criar modal ou formulário para coleta de dados da receita
    const modal = this.createPrescriptionModal();
    document.body.appendChild(modal);
  }

  createPrescriptionModal() {
    const modal = document.createElement('div');
    modal.className = 'prescription-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
      background: rgba(0,0,0,0.5); z-index: 10000; 
      display: flex; align-items: center; justify-content: center;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; width: 90%; max-height: 80vh; overflow: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">🧾 Gerar Nova Receita</h3>
          <button id="close-prescription-modal" style="background: none; border: none; font-size: 18px; cursor: pointer;">✕</button>
        </div>
        
        <form id="prescription-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 600;">Patient ID:</label>
            <input type="text" id="patientId" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 600;">Doctor ID:</label>
            <input type="text" id="doctorId" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 600;">Appointment ID:</label>
            <input type="text" id="appointmentId" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 600;">Medicamento:</label>
            <input type="text" id="drug" required placeholder="Ex: Paracetamol 500mg" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 600;">Posologia:</label>
            <input type="text" id="dose" required placeholder="Ex: 1 cp 8/8h por 3 dias" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          </div>
          
          <div style="display: flex; gap: 12px;">
            <button type="button" id="cancel-prescription" style="flex: 1; padding: 10px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">Cancelar</button>
            <button type="submit" id="generate-prescription" style="flex: 1; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Gerar Receita</button>
          </div>
        </form>
        
        <div id="prescription-result" style="margin-top: 16px; display: none;"></div>
      </div>
    `;

    // Event listeners do modal
    const closeBtn = modal.querySelector('#close-prescription-modal');
    const cancelBtn = modal.querySelector('#cancel-prescription');
    const form = modal.querySelector('#prescription-form');

    closeBtn.addEventListener('click', () => this.closeModal(modal));
    cancelBtn.addEventListener('click', () => this.closeModal(modal));
    form.addEventListener('submit', (e) => this.handlePrescriptionSubmit(e, modal));

    // Auto-preencher campos se disponíveis
    this.autofillFields(modal);

    return modal;
  }

  autofillFields(modal) {
    // Tentar extrair IDs dos parâmetros da URL ou localStorage
    const urlParams = new URLSearchParams(window.location.search);
    
    const patientIdField = modal.querySelector('#patientId');
    const doctorIdField = modal.querySelector('#doctorId');
    const appointmentIdField = modal.querySelector('#appointmentId');

    // Auto-preencher com dados disponíveis
    if (patientIdField) {
      patientIdField.value = urlParams.get('patientId') || 
                             localStorage.getItem('patientId') || 
                             localStorage.getItem('LAST_PATIENT_ID') || '';
    }

    if (doctorIdField) {
      doctorIdField.value = localStorage.getItem('doctorId') || 
                           urlParams.get('doctorId') || '';
    }

    if (appointmentIdField) {
      appointmentIdField.value = urlParams.get('appointmentId') || 
                                urlParams.get('room') || '';
    }
  }

  async handlePrescriptionSubmit(event, modal) {
    event.preventDefault();
    
    if (this.loadingState) return;

    const formData = new FormData(event.target);
    const patientId = modal.querySelector('#patientId').value;
    const doctorId = modal.querySelector('#doctorId').value;
    const appointmentId = modal.querySelector('#appointmentId').value;
    const drug = modal.querySelector('#drug').value;
    const dose = modal.querySelector('#dose').value;

    const resultDiv = modal.querySelector('#prescription-result');
    const submitBtn = modal.querySelector('#generate-prescription');

    // Validação básica
    if (!patientId || !doctorId || !appointmentId || !drug || !dose) {
      this.showResult(resultDiv, 'error', 'Todos os campos são obrigatórios');
      return;
    }

    try {
      this.loadingState = true;
      submitBtn.textContent = 'Gerando...';
      submitBtn.disabled = true;

      // Fazer a requisição conforme o exemplo do usuário
      const resp = await fetch("/api/rc/prescriptions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patientId: patientId,
          doctorId: doctorId,
          appointmentId: appointmentId,
          items: [{ 
            drug: drug, 
            dose: dose 
          }],
        }),
      });

      if (!resp.ok) {
        throw new Error(`Falha ao gerar receita: ${resp.status} - ${resp.statusText}`);
      }

      const data = await resp.json();
      
      // Mostrar resultado de sucesso
      this.showResult(resultDiv, 'success', `Receita gerada com sucesso! ID: ${data.id || 'N/A'}`);
      
      // Atualizar lista de receitas na página
      this.updatePrescriptionsList(data);

      // Log de sucesso com appointmentId/rxId para observabilidade (hash patientId para privacidade)
      const hashedPatientId = await this.hashForPrivacy(patientId);
      console.log(`✅ Prescription generated: rxId=${data.id || 'N/A'}, appointmentId=${appointmentId}, patientHash=${hashedPatientId}, timestamp=${new Date().toISOString()}`);
      
      // Opcional: enviar evento de analytics se configurado (sem PHI)
      if (window.TelemedAnalytics && typeof window.TelemedAnalytics.track === 'function' && process.env.ENABLE_ANALYTICS === '1') {
        window.TelemedAnalytics.track('prescription_generated', {
          rxId: data.id,
          appointmentId,
          patientHash: hashedPatientId, // Use hash em vez de patientId raw
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ Erro ao gerar receita:', error);
      this.showResult(resultDiv, 'error', `Erro: ${error.message}`);
    } finally {
      this.loadingState = false;
      submitBtn.textContent = 'Gerar Receita';
      submitBtn.disabled = false;
    }
  }

  showResult(container, type, message) {
    container.style.display = 'block';
    container.className = `prescription-result ${type}`;
    container.innerHTML = `
      <div style="padding: 12px; border-radius: 6px; ${type === 'success' ? 'background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;'}">
        ${type === 'success' ? '✅' : '❌'} ${message}
      </div>
    `;
  }

  updatePrescriptionsList(prescriptionData) {
    const rxList = document.getElementById('rxList');
    if (rxList) {
      if (rxList.textContent.includes('Nenhuma receita ainda')) {
        rxList.innerHTML = '';
      }
      
      const prescriptionItem = document.createElement('div');
      prescriptionItem.style.cssText = 'padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; background: #f9fafb;';
      prescriptionItem.innerHTML = `
        <div style="font-weight: 600;">Receita ID: ${prescriptionData.id || 'N/A'}</div>
        <div style="font-size: 12px; color: #6b7280;">Gerada em: ${new Date().toLocaleString('pt-BR')}</div>
        ${prescriptionData.url ? `<a href="${prescriptionData.url}" target="_blank" style="color: #3b82f6; text-decoration: none;">📄 Visualizar PDF</a>` : ''}
      `;
      
      rxList.appendChild(prescriptionItem);
    }
  }

  async hashForPrivacy(data) {
    if (!data) return 'empty';
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      const hashHex = Array.from(hashArray).map(byte => byte.toString(16).padStart(2, '0')).join('');
      return hashHex.substring(0, 8); // Primeiros 8 caracteres do hash
    } catch (e) {
      return 'hash-error';
    }
  }

  closeModal(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  new PrescriptionGenerator();
});

// Também inicializar se o script for carregado após o DOM
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  new PrescriptionGenerator();
}
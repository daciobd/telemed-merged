/**
 * TeleMed - Exemplo de Integração QR Code
 * 
 * Este exemplo mostra como gerar QR codes que apontam para verify-rx.html
 * Use junto com rx-template.html para PDF completo
 */

// Exemplo usando qrcode biblioteca (npm install qrcode)
const QRCode = require('qrcode');

async function generatePrescriptionQR(rxId, domain = 'https://telemed.local') {
  const verifyUrl = `${domain}/verify-rx.html?rx_id=${rxId}`;
  
  try {
    // Gera QR como data URL base64
    const qrDataURL = await QRCode.toDataURL(verifyUrl, {
      width: 110,
      margin: 1,
      color: {
        dark: '#0b1020',
        light: '#ffffff'
      }
    });
    
    return qrDataURL; // Use como {{qr_base64}} no template
  } catch (error) {
    console.error('Erro ao gerar QR:', error);
    return null;
  }
}

// Exemplo de uso no servidor/worker de PDF
async function generatePrescriptionPDF(prescriptionData) {
  const qrBase64 = await generatePrescriptionQR(prescriptionData.rx_id);
  
  const templateData = {
    // Dados da clínica
    clinic_name: 'TeleMed Clínica Exemplo',
    clinic_cnpj: '12.345.678/0001-90',
    clinic_addr: 'Rua da Saúde, 123 - São Paulo/SP',
    
    // Dados da receita
    rx_id: prescriptionData.rx_id,
    issued_at: new Date().toLocaleString('pt-BR'),
    
    // Dados do paciente
    patient_name: prescriptionData.patient.name,
    patient_doc: prescriptionData.patient.document,
    
    // Medicamentos
    items: prescriptionData.items,
    
    // Dados do médico
    doctor_name: prescriptionData.doctor.name,
    doctor_crm: prescriptionData.doctor.crm,
    doctor_uf: prescriptionData.doctor.uf,
    
    // Segurança
    content_hash: prescriptionData.content_hash,
    qr_base64: qrBase64 // QR aponta para verify-rx.html
  };
  
  // Use com seu motor de template (Handlebars, Mustache, etc)
  // const html = Handlebars.compile(rxTemplate)(templateData);
  // const pdf = await htmlToPdf(html);
  
  return templateData;
}

// Exemplo de geração de hash SHA-256 do conteúdo
function generateContentHash(prescriptionData) {
  const crypto = require('crypto');
  
  // Dados ordenados para hash consistente
  const hashData = {
    appointmentId: prescriptionData.appointmentId,
    items: prescriptionData.items.map(item => ({
      name: item.name,
      directions: item.directions,
      quantity: item.quantity
    })).sort((a, b) => a.name.localeCompare(b.name)),
    doctor: {
      crm: prescriptionData.doctor.crm,
      uf: prescriptionData.doctor.uf
    },
    issuedAt: prescriptionData.issuedAt
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashData))
    .digest('hex');
}

module.exports = {
  generatePrescriptionQR,
  generatePrescriptionPDF,
  generateContentHash
};
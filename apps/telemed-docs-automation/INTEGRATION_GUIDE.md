# 🔗 Guia de Integração - TeleMed Docs Automation

## Como integrar no TeleMed principal

### 1. No encerramento da consulta
```javascript
// No frontend TeleMed, após finalizar consulta
async function generateDocuments(consultationData) {
  const summary = buildConsultationSummary(consultationData);
  
  // Gerar receita se houver prescrições
  if (consultationData.prescriptions?.length > 0) {
    const prescriptionPayload = {
      type: 'prescription',
      items: consultationData.prescriptions,
      obs: consultationData.observations
    };
    
    const response = await fetch(`${window.TELEMED_CFG.DOCS_AUTOMATION_URL}/generate/prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.INTERNAL_TOKEN
      },
      body: JSON.stringify({ summary, payload: prescriptionPayload })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('Receita gerada:', result.doc.filename);
      // Mostrar modal de revisão para o médico
      showDocumentReview('prescription', result.doc);
    }
  }
  
  // Gerar atestado se necessário
  if (consultationData.needsAttestation) {
    // Lógica similar para atestado...
  }
}
```

### 2. Modal de revisão/assinatura
```javascript
function showDocumentReview(type, doc) {
  // Mostrar modal com:
  // - Preview dos itens da receita/atestado (editáveis)
  // - Botão "Assinar & Enviar"
  // - Botão "Regenerar" se houver alterações
  
  // Ao clicar "Assinar & Enviar":
  // 1. Enviar para Receita Certa (assinatura digital)
  // 2. Notificar paciente via WhatsApp/e-mail
}
```

### 3. Notificar paciente
```javascript
async function notifyPatientWithDocument(patient, documentUrl) {
  const response = await fetch(`${window.TELEMED_CFG.DOCS_AUTOMATION_URL}/generate/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_TOKEN
    },
    body: JSON.stringify({
      patient: {
        email: patient.email,
        phone: patient.phone
      },
      message: `Olá ${patient.name}! Seus documentos médicos estão prontos. Acesse: ${documentUrl}`,
      attachmentUrl: documentUrl
    })
  });
}
```

## Configurações necessárias

### No render.yaml dos outros serviços:
```yaml
envVars:
  - key: DOCS_AUTOMATION_URL
    value: https://telemed-docs-automation.onrender.com
  - key: INTERNAL_TOKEN
    value: change-me-internal  # Mesmo token em todos os serviços
```

### No frontend config.js:
```javascript
window.TELEMED_CFG = {
  DOCS_AUTOMATION_URL: "https://telemed-docs-automation.onrender.com"
};
```

## Próximos passos recomendados

### 1. Armazenamento S3/CDN
- Enviar PDFs para S3 após geração
- Retornar URL assinada (expira em 15 min)
- Permite acesso direto pelo paciente

### 2. UI de revisão no React
- Componente modal para revisar documentos
- Editor inline para ajustar prescrições
- Integração com Receita Certa

### 3. Logs e monitoramento
- Logs estruturados com consultationId
- Métricas de sucesso/erro por endpoint
- Alertas para falhas do Receita Certa

### 4. Templates customizáveis
- Templates por especialidade médica
- Personalização por médico (carimbo, logo)
- Conformidade CFM
# Telemed Docs Automation (MVP)

Módulo mínimo para PODER **gerar automaticamente receitas e atestados** a partir de um **resumo da consulta** e **CID sugerido**. 

## Rodando no Replit / local
1. Crie um Repl Node.js (ou Nix) e cole os arquivos.
2. `npm i`
3. Copie `.env.example` para `.env` e ajuste as variáveis.
4. `npm run dev`
5. Teste com curl/Postman:

### Receita
```bash
curl -X POST http://localhost:8080/generate/prescription \
  -H 'Content-Type: application/json' \
  -d '{
    "summary": {
      "consultationId": "c-123",
      "patient": { "id":"p-1","name":"Fulano","email":"fulano@mail.com","phone":"+5511999999999" },
      "clinician": { "id":"m-1", "name":"Dra. Ana", "crm":"12345-SP" },
      "suggestedCid": "J02.9",
      "timestamp": "2025-09-02T12:00:00Z"
    },
    "payload": {
      "type": "prescription",
      "items": [
        {"drug":"Amoxicilina 500mg","dose":"1 cápsula","route":"VO","frequency":"8/8h","duration":"7 dias","notes":"Tomar após as refeições"}
      ],
      "obs": "Beber água, repouso relativo"
    }
  }'
```

### Atestado
```bash
curl -X POST http://localhost:8080/generate/attestation \
  -H 'Content-Type: application/json' \
  -d '{
    "summary": {
      "consultationId": "c-123",
      "patient": { "id":"p-1","name":"Fulano" },
      "clinician": { "id":"m-1", "name":"Dra. Ana", "crm":"12345-SP" },
      "suggestedCid": "J06.9",
      "timestamp": "2025-09-02T12:00:00Z"
    },
    "payload": {
      "type": "attestation",
      "reason": "IVAS viral",
      "startDate": "2025-09-02",
      "daysOff": 3,
      "restrictions": "Evitar atividades físicas intensas"
    }
  }'
```

### Notificação
```bash
curl -X POST http://localhost:8080/generate/notify \
  -H 'Content-Type: application/json' \
  -d '{
    "patient": { "email":"fulano@mail.com", "phone":"+5511999999999" },
    "message": "Sua receita está pronta!",
    "attachmentUrl": "https://cdn.telemed.app/prescription_123.pdf"
  }'
```

## Integração com TeleMed

### 1. No encerramento da consulta
Chamar o serviço passando o summary + payload:

```javascript
const response = await fetch(`${DOCS_AUTOMATION_URL}/generate/prescription`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ summary, payload })
});
```

### 2. Renderizar rascunho na UI
Permitir edição e então "Assinar & Enviar" via Receita Certa.

### 3. Notificar paciente
Usar `/generate/notify` para WhatsApp/e-mail com link do PDF.

## O que já vem pronto

- **Endpoints**: `/generate/prescription`, `/generate/attestation`, `/generate/notify`
- **Templates**: Handlebars para receita e atestado  
- **Hook Receita Certa**: `sendToReceitaCerta()` pronto para integração
- **Tipos TypeScript**: `ConsultationSummary`, `PrescriptionItem`, etc.
- **CORS configurado**: Para integração com frontend TeleMed

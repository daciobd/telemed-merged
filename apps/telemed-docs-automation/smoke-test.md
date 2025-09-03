# 🧪 Smoke Tests - TeleMed Docs Automation

## Testes Manuais (15-20 min)

### 1. Health Check
```bash
curl http://localhost:8080/healthz
# Esperado: { "ok": true }
```

### 2. Teste de Receita
```bash
curl -X POST http://localhost:8080/generate/prescription \
  -H 'Content-Type: application/json' \
  -H 'X-Internal-Token: change-me-internal' \
  -d '{
    "summary": {
      "consultationId": "c-test-123",
      "patient": { "id":"p-1","name":"João Teste","email":"joao@test.com" },
      "clinician": { "id":"m-1", "name":"Dra. Ana", "crm":"12345-SP" },
      "suggestedCid": "J02.9",
      "timestamp": "2025-09-03T12:00:00Z"
    },
    "payload": {
      "type": "prescription",
      "items": [
        {"drug":"Amoxicilina 500mg","dose":"1 cápsula","route":"VO","frequency":"8/8h","duration":"7 dias"}
      ]
    }
  }'
# Esperado: { "ok": true, "doc": {...}, "receitaCerta": {...} }
```

### 3. Teste de Atestado
```bash
curl -X POST http://localhost:8080/generate/attestation \
  -H 'Content-Type: application/json' \
  -H 'X-Internal-Token: change-me-internal' \
  -d '{
    "summary": {
      "consultationId": "c-test-123",
      "patient": { "id":"p-1","name":"João Teste" },
      "clinician": { "id":"m-1", "name":"Dra. Ana", "crm":"12345-SP" },
      "timestamp": "2025-09-03T12:00:00Z"
    },
    "payload": {
      "type": "attestation",
      "reason": "IVAS viral",
      "startDate": "2025-09-03",
      "daysOff": 3
    }
  }'
# Esperado: { "ok": true, "doc": {...} }
```

### 4. Teste de Notificação
```bash
curl -X POST http://localhost:8080/generate/notify \
  -H 'Content-Type: application/json' \
  -H 'X-Internal-Token: change-me-internal' \
  -d '{
    "patient": { "email":"test@mail.com", "phone":"+5511999999999" },
    "message": "Teste de notificação",
    "attachmentUrl": "https://example.com/doc.pdf"
  }'
# Esperado: { "ok": true }
```

### 5. Teste de Auth (deve falhar)
```bash
curl -X POST http://localhost:8080/generate/prescription \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
# Esperado: 401 { "error": "Missing X-Internal-Token header" }
```

### 6. Teste Frontend
- Abrir `example-docs-integration.html` no navegador
- Testar todos os botões
- Verificar se os PDFs são criados em `out/`

## Checklist de Validação
- [ ] Health check responde `200 OK`
- [ ] Receita gera PDF em `out/prescription_*.pdf`
- [ ] Atestado gera PDF em `out/attestation_*.pdf`
- [ ] Notificação loga sucesso no console
- [ ] Auth protege endpoints (401 sem token)
- [ ] CORS permite origem configurada
- [ ] Frontend integração funciona
# Sistema de Telemetria - Setup Completo ✅

## Status Atual

✅ **Backend funcionando** - Servidor rodando na porta 5000  
✅ **Endpoints configurados** - `/api/telemetry/event`, `/api/telemetry/metrics`, `/api/telemetry/ping`  
✅ **Scripts frontend instalados** - Telemetria ativa em páginas principais  
✅ **Logs de debug habilitados** - Console mostra `[telemetry]` para diagnóstico  
✅ **Página de admin criada** - Interface para ativar/testar telemetria  

## Como Usar

### 1. Ativar a Telemetria

Acesse a página de administração:
```
http://localhost:5000/public/admin-telemetry.html
```

Clique em **"✓ Ativar Telemetria"**

### 2. Verificar se Está Funcionando

No navegador, abra o DevTools (F12) → Console

Navegue pelo site e você verá logs tipo:
```
[telemetry] 200 {ok: true}
```

### 3. Testar com Atalho de Teclado

Em qualquer página com telemetria ativa, pressione:
```
Alt + T
```

Isso enviará 10 eventos de teste. Você verá um alerta confirmando.

### 4. Ver as Métricas

Acesse o dashboard de métricas:
```
http://localhost:5000/dashboard-piloto.html
```

Você verá:
- Usuários ativos (últimas 24h)
- Total de eventos por tipo
- Gráfico de eventos por hora
- Top páginas visitadas

## Endpoints Disponíveis

### POST /api/telemetry/event
Recebe eventos de telemetria

**Request:**
```json
{
  "event_name": "cta_click",
  "ts": "2025-10-05T18:00:00.000Z",
  "session_id": "abc-123",
  "role": "patient",
  "page": "/index.html",
  "event_props": {
    "step_index": 1
  }
}
```

**Response:**
```json
{
  "ok": true
}
```

### GET /api/telemetry/metrics?range=24h
Busca métricas agregadas

**Response:**
```json
{
  "window": "24h",
  "totals": {
    "active_users": "106",
    "asks": "0",
    "errors": "0",
    "avg_duration": null
  },
  "series": {
    "by_hour": [...]
  },
  "breakdowns": {
    "by_event": [...],
    "top_pages": [...]
  }
}
```

### GET /api/telemetry/ping
Testa se o endpoint está respondendo

**Response:**
```json
{
  "ok": true,
  "message": "Telemetry endpoint is working"
}
```

## Eventos Rastreados

| Evento | Descrição |
|--------|-----------|
| `page_view` | Visualização de página |
| `cta_click` | Clique em CTA/botão principal |
| `tour_start` | Início de tour guiado |
| `tour_step` | Passo do tour |
| `ask_submitted` | Pergunta enviada ao Dr. AI |
| `ask_error` | Erro ao processar pergunta |

## Páginas com Telemetria

✅ `/index.html` - Landing page (telemetry-ctas.js)  
✅ `/public/dr-ai-demo.html` - Demo Dr. AI (telemetry-dr-ai.js)  
✅ `/dashboard-piloto.html` - Dashboard (inline)  

## Arquivos Modificados

### Frontend
- `apps/telemed-deploy-ready/assets/js/telemetry-ctas.js` - Logs de debug adicionados
- `apps/telemed-deploy-ready/assets/js/telemetry-dr-ai.js` - Logs de debug adicionados
- `apps/telemed-deploy-ready/public/dr-ai-demo.html` - Script telemetry-dr-ai.js adicionado
- `apps/telemed-deploy-ready/public/admin-telemetry.html` - **NOVO** - Página de admin

### Backend
- `apps/telemed-deploy-ready/server/telemetry.js` - Função `handleTelemetryPing` adicionada
- `apps/telemed-deploy-ready/server.js` - Rota `/api/telemetry/ping` adicionada

## Diagnóstico de Problemas

### Telemetria não envia eventos

**Problema:** Console não mostra `[telemetry]` logs  
**Solução:** Ative a telemetria em `/public/admin-telemetry.html`

### Endpoint retorna 404

**Problema:** POST para `/api/telemetry/event` retorna 404  
**Solução:** Verifique se o servidor está rodando (`npm run dev`)

### Endpoint retorna HTML em vez de JSON

**Problema:** Response é HTML (`<!doctype html>...`)  
**Solução:** URL incorreta ou servidor não está processando a rota. Teste com `/api/telemetry/ping`

### Erro "invalid_event"

**Problema:** `{"ok": false, "error": "invalid_event"}`  
**Solução:** Nome do evento não está na lista permitida. Eventos válidos: `page_view`, `cta_click`, `tour_start`, `tour_step`, `ask_submitted`, `ask_error`

## Checklist de Verificação Rápida

```bash
# 1. Servidor rodando?
curl http://localhost:5000/api/telemetry/ping

# 2. Endpoint de eventos funcionando?
curl -X POST http://localhost:5000/api/telemetry/event \
  -H "Content-Type: application/json" \
  -d '{"event_name":"page_view","ts":"2025-10-05T18:00:00.000Z","session_id":"test","page":"/"}'

# 3. Métricas acessíveis?
curl http://localhost:5000/api/telemetry/metrics?range=24h
```

Todos devem retornar JSON com `"ok": true`.

## Próximos Passos (Opcional)

- [ ] Adicionar mais eventos customizados
- [ ] Configurar retenção de dados (atualmente 7 dias)
- [ ] Exportar métricas para Grafana/Prometheus
- [ ] Adicionar alertas baseados em thresholds
- [ ] Implementar A/B testing via telemetria

---

**Última atualização:** 2025-10-05  
**Autor:** Replit Agent

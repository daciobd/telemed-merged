# Configuração de Monitoramento Externo - TeleMed Piloto

## Endpoints de Monitoramento

### 🔗 URLs para Monitoramento

**Produção (Render):**
- Status Principal: `https://telemed-internal.onrender.com/status.json`
- Health Check: `https://telemed-internal.onrender.com/api/health`
- Gateway Status: `https://telemed-gateway.onrender.com/status.json` *(após deploy)*

**Desenvolvimento:**
- Status Local: `http://localhost:5000/status.json`

## 📊 UptimeRobot - Configuração

### 1. Criar Monitor Principal

```
Tipo: HTTP(s)
URL: https://telemed-internal.onrender.com/status.json
Nome: TeleMed Core Service
Intervalo: 5 minutos
Timeout: 30 segundos
```

**Configuração de Alertas:**
- **Critério**: Response não é 200 OU contém "unhealthy"
- **Notificações**: Email + Slack/WhatsApp
- **Escalação**: 2 failures consecutivos = alerta

### 2. Monitor de Gateway (quando disponível)

```
Tipo: HTTP(s)  
URL: https://telemed-gateway.onrender.com/status.json
Nome: TeleMed Gateway
Intervalo: 5 minutos
```

### 3. Monitor de Frontend

```
Tipo: HTTP(s)
URL: https://telemed-deploy-ready.onrender.com/health.json
Nome: TeleMed Frontend
Intervalo: 10 minutos
```

## 🚨 Pingdom - Configuração Alternativa

### Monitor de Uptime
```
URL: https://telemed-internal.onrender.com/status.json
Nome: TeleMed API Status
Check interval: 1 minute
Locations: US East, US West, Europe
```

### Monitor de Performance
```
URL: https://telemed-deploy-ready.onrender.com/
Nome: TeleMed Frontend Performance
Check interval: 5 minutes
Alert if response time > 5 seconds
```

## 📱 Configuração de Alertas

### Slack Integration
```
Webhook URL: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
Channel: #telemed-alerts
Message format:
🚨 ALERTA: {monitor_name}
Status: {status}
URL: {url}
Time: {datetime}
```

### WhatsApp (via Zapier/n8n)
```
Trigger: UptimeRobot webhook
Action: Send WhatsApp message
Number: +55 11 99999-9999
Message: "🚨 TeleMed: {service} está DOWN. Verificar imediatamente."
```

### Email Alerts
```
Recipients: admin@telemed.com, ops@telemed.com
Subject: [URGENT] TeleMed Service Alert
Include: Full status JSON + historical data
```

## 📈 Interpretação do Status JSON

### Status Codes
- `200` - Tudo funcionando perfeitamente
- `206` - Serviço degradado (lento mas funcional)  
- `503` - Serviço indisponível

### Response Format
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-09-16T20:30:00.000Z",
  "service": {
    "name": "telemed-internal",
    "version": "1.0.0",
    "uptime": 86400,
    "environment": "production"
  },
  "components": {
    "database": {
      "status": "healthy",
      "response_time_ms": 45
    },
    "openai": {
      "status": "healthy",
      "response_time_ms": 1200
    }
  },
  "metrics": {
    "total_response_time_ms": 1500
  }
}
```

### Critérios de Alerta

**🔴 CRÍTICO (status: unhealthy)**
- Database inacessível
- Servidor não responde
- Erros 500+ consistentes

**🟡 ATENÇÃO (status: degraded)**  
- Database lento (>1s)
- OpenAI lento (>3s)
- Response time total >5s

**🟢 OK (status: healthy)**
- Todos componentes funcionando
- Response times normais
- Sem erros recentes

## 🔧 Scripts de Monitoramento

### Teste Manual
```bash
# Testar status
curl -s https://telemed-internal.onrender.com/status.json | jq

# Verificar se está healthy
curl -s https://telemed-internal.onrender.com/status.json | jq -r '.status'

# Monitoring script simples
#!/bin/bash
STATUS=$(curl -s https://telemed-internal.onrender.com/status.json | jq -r '.status')
if [ "$STATUS" != "healthy" ]; then
  echo "ALERT: TeleMed status is $STATUS"
  # Enviar notificação
fi
```

### Webhook Receiver (Node.js)
```javascript
// Para receber alertas do UptimeRobot
app.post('/alerts/uptimerobot', (req, res) => {
  const { monitorFriendlyName, alertType, alertDetails } = req.body;
  
  // Processar alerta
  console.log(`Alert: ${monitorFriendlyName} - ${alertType}`);
  
  // Repassar para Slack/WhatsApp/SMS
  // ...
  
  res.status(200).send('OK');
});
```

## ⚙️ Configuração Avançada

### Healthchecks.io
```
URL: https://hc-ping.com/YOUR-UUID
Método: GET para https://telemed-internal.onrender.com/status.json
Grace Period: 5 minutos
Cron Schedule: */5 * * * * (a cada 5 min)
```

### Datadog Synthetic Tests
```
Test Type: API Test
URL: https://telemed-internal.onrender.com/status.json
Assertions:
- Response time < 3000ms
- Status code = 200
- Body contains "healthy"
Frequency: Every 5 minutes
```

## 🎯 Métricas Recomendadas

### SLAs Sugeridos
- **Uptime**: 99.5% (downtime máximo: ~3.6h/mês)
- **Response Time**: 95% das requests < 2s  
- **Availability**: Serviço disponível 24/7
- **Recovery Time**: < 15 minutos para incidents

### Dashboards
- Uptime último 30 dias
- Response time trends
- Error rate por serviço
- Incident frequency

---

**🚀 NEXT STEPS:**
1. Configurar monitors no UptimeRobot
2. Testar webhooks de alerta
3. Validar notificações Slack/WhatsApp  
4. Documentar playbook de incidentes
5. Setup dashboard público de status

*Última atualização: Set 2025 - Versão Piloto*
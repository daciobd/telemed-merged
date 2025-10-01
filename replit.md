# TeleMed Platform - Documentação

## Overview
A Plataforma TeleMed é uma solução unificada de telemedicina que integra três aplicações em um monorepo com cinco microsserviços. Ela oferece workflows de consulta, calculadoras médicas, prescrição digital, automação de documentos com integração AWS S3, um sistema de triagem médica baseado em IA (Dr. AI Medical Triage), e módulos plug-and-play para chat, gestão de pacientes, agendamento e suporte. O projeto está pronto para produção, com foco em conformidade com as regulamentações brasileiras de telemedicina, visando o mercado nacional de saúde digital.

## User Preferences
- **Linguagem**: Português brasileiro
- **Comunicação**: Linguagem simples e cotidiana
- **Contexto**: Telemedicina brasileira com compliance CFM

## System Architecture
A plataforma é construída como um monorepo contendo cinco microsserviços Dockerizados, orquestrados para deploy no Render.

**Microserviços:**
-   **telemed-auth-server** (Port 3001): Autenticação JWT e gestão de usuários.
-   **telemed-calculator-api** (Port 3002): Calculadoras e ferramentas médicas.
-   **telemed-prescription-api** (Port 3003): Prescrições digitais e verificação farmacêutica.
-   **telemed-deploy-ready** (Port 3000): Frontend unificado.
-   **telemed-docs-automation** (Port 8080): Automação de documentos médicos (receitas e atestados CFM-compliant em PDF, com integração AWS S3).

**Frontend (telemed-deploy-ready):**
-   **Tecnologias**: React com TypeScript, React Router, React Query + Context API, Tailwind CSS, Vite.
-   **UI/UX**: Componentes responsivos, modal de prescrição ANVISA, chat flutuante, filtros de busca, dashboard de métricas, e um widget de suporte.
-   **Dr. AI Medical Triage**: Interface LGPD-compliant, algoritmo de triagem por pattern-matching, sistema de "Red Flags" para urgências, validação médica e dashboard.
-   **Funcionalidades Adicionais**: Chat na Consulta com CID-10/CIAP, gerenciamento de pacientes, agendamento, widget de suporte/ajuda, Toast Notifications com Tour Guiado, Assistente Dr. AI.

**Backend (Microserviços):**
-   **Tecnologias**: Express.js + TypeScript.
-   **Autenticação**: JWT + bcrypt.
-   **Banco de Dados**: PostgreSQL com Drizzle ORM.
-   **Documentos**: PDFKit + Handlebars para geração de documentos com QR Codes.
-   **Validação**: Zod schemas.

**Infraestrutura e Deploys:**
-   **Deploy**: Render (5 serviços configurados via `render.yaml`).
-   **Banco de Dados**: PostgreSQL no Render.
-   **Monitoramento**: Health checks.
-   **Documentação API**: OpenAPI 3.1 Specification com suporte a WebSocket.
-   **Testes**: Playwright Smoke Tests para 6 cenários críticos.
-   **Infraestrutura como Código**: `render.yaml` para Preview Environments, Environment Groups, Services (Web, Worker, Cron Jobs, Key Value), Health Checks e Scaling.
-   **Segurança**: Segredos centralizados, TLS automático, proteção DDoS, Custom Domain.
-   **Operações**: Cron Jobs (cleanup, backups), Key Value Store (Redis), PostgreSQL Backups, Observabilidade (Datadog/Metrics Streams).

## External Dependencies
-   **AWS S3**: Armazenamento seguro de documentos médicos (PDFs) e geração de URLs assinadas.
-   **PostgreSQL**: Banco de dados relacional.
-   **Render**: Plataforma de deployment.
-   **PDFKit**: Geração de documentos PDF.
-   **Handlebars/Mustache**: Templating de documentos PDF.
-   **Playwright**: Testes de ponta a ponta.
-   **Swagger/OpenAPI**: Documentação da API.
-   **Shadcn/ui + Radix UI**: Componentes de UI para o frontend.
-   **Redis**: Key Value Store para cache/filas de chat.
-   **Datadog**: Monitoramento e observabilidade.

## 📦 Kit Modular Dr. AI - Componentes TypeScript

### Visão Geral
Arquitetura modular e reutilizável do Assistente Dr. AI, com componentes separados, hook customizado e **integração completa com o servidor HTTP**.

### ⚠️ Arquitetura do Projeto
**IMPORTANTE**: Este projeto usa **servidor HTTP nativo Node.js** (não Next.js, não Express framework).
- **Frontend**: HTML estático + React via CDN (ou build Vite futuro)
- **Backend**: `apps/telemed-deploy-ready/server.js` - Servidor HTTP simples
- **NÃO usa**: Next.js API routes, `app/api/` directory, ou padrões Next.js

### Estrutura de Arquivos
**Localização**: `/src/components/telemed-ai/`

```
telemed-ai/
├── api.ts                    # Stubs de API (answers, tts, stt, auditLog)
├── hooks/
│   └── use-telemed-ai.ts     # Hook com lógica de estado e guardrails
├── ConsentGate.tsx           # Gate de consentimento LGPD
├── MessageBubble.tsx         # Componente de mensagem (dark mode)
├── EmergencyCTA.tsx          # CTA de emergência sticky
├── OutOfScopeDialog.tsx      # Modal fora do escopo
├── TelemedAIInterface.tsx    # Interface principal completa
└── index.ts                  # Barrel exports
```

### Como Usar

**Import completo do barrel**:
```typescript
import { TelemedAIInterface } from "@/components/telemed-ai";
```

**Imports individuais**:
```typescript
import { 
  ConsentGate, 
  MessageBubble,
  EmergencyCTA,
  useTelemedAI 
} from "@/components/telemed-ai";
```

**Usar o hook isoladamente**:
```typescript
const doctorInfo = {
  name: "Dr. Roberto Silva",
  specialty: "Cardiologia",
  lastConsult: "25/09/2025",
  nextConsult: "25/10/2025"
};

const { 
  messages, 
  inputText,
  setInputText,
  send, 
  typing,
  showOutOfScope,
  setShowOutOfScope 
} = useTelemedAI(doctorInfo);
```

### ✅ API Integrada com Servidor

As APIs já estão **totalmente integradas** com o servidor HTTP! 

**Rotas Disponíveis** (em `server.js`):
- `POST /api/ai/answer` - Envia pergunta, recebe resposta JSON estruturada validada (tipo, mensagem, metadados)
- `POST /api/ai/audit` - Log de auditoria/telemetria
- `POST /api/ai/tts` - Text-to-Speech (retorna data URI)
- `POST /api/ai/stt` - Speech-to-Text (recebe áudio, retorna transcrição)

**Arquivo `api.ts`**: Já configurado para usar `fetch()` e chamar as rotas acima.

**Para substituir com backend real**:
1. Edite as rotas em `apps/telemed-deploy-ready/server.js`
2. Adicione lógica de IA real (OpenAI, etc.)
3. Conecte com banco de dados PostgreSQL conforme necessário

### Funcionalidades do Kit

- ✅ **Consent Gate LGPD**: Checkbox obrigatório com disclaimer
- ✅ **Audit Logging**: Sistema de telemetria completo
- ✅ **Scope Detection**: Regex identifica perguntas fora do escopo
- ✅ **Emergency Escalation**: Fluxo dedicado para urgências
- ✅ **Dark Mode**: Suporte completo com classes `dark:`
- ✅ **Cooldown Anti-spam**: 1.5s entre mensagens
- ✅ **Quick Questions**: 4 perguntas pré-definidas

### Páginas Demo

- **Versão HTML/CDN**: `/dr-ai-assistant.html` - Interface standalone com React via CDN
- **Documentação Modular**: `/dr-ai-modular.html` - Guia de uso dos componentes

### Navegação
- **Homepage**: Botão "📦 Kit Modular Dr. AI" (`data-testid="button-dr-ai-modular"`)

## 🚀 Recent Changes (30/09/2025)

### Melhoria #1: Saída JSON Estruturada + Validação de Schema ✅

**Implementação completa de resposta estruturada com Zod para o Dr. AI Assistant:**

**Arquivos Criados/Modificados:**
- `lib/schema.js` - Schema Zod definindo 4 tipos de resposta:
  - `esclarecimento` - Resposta normal sobre orientações existentes
  - `escala_emergencia` - Sintomas de emergência detectados
  - `fora_escopo` - Pergunta fora do escopo das orientações
  - `erro` - Erro no processamento
  
- `lib/prompt.js` - System prompt atualizado com:
  - Anti-injeção de prompt (ignore instruções maliciosas)
  - Saída JSON forçada via `response_format: { type: "json_object" }`
  - Regras claras de classificação

- `lib/ai.js` - Nova função `askModelJSON()`:
  - Parsing e validação JSON com Zod
  - Fallback seguro em caso de erro (sem mutação de estado)
  - Contexto médico estruturado com dias desde consulta

- `routes/ai.js` - Handler atualizado:
  - Retorna JSON estruturado validado
  - Override de emergência quando detectado
  - Tratamento de erros com respostas estruturadas

**Benefícios:**
- ✅ Respostas previsíveis e tipadas
- ✅ Validação automática de schema
- ✅ Proteção contra prompt injection
- ✅ Fallback seguro sem corrupção de estado
- ✅ Melhor integração com frontend

**Testes Realizados:**
```bash
# Esclarecimento
POST /api/ai/answer {"question": "Como tomar o remédio?"} 
→ {"tipo": "esclarecimento", "mensagem": "...", "metadados": {...}}

# Emergência
POST /api/ai/answer {"question": "Dor no peito forte!"} 
→ {"tipo": "escala_emergencia", "mensagem": "...", "metadados": {...}}

# Fora de escopo
POST /api/ai/answer {"question": "Trocar remédio?"} 
→ {"tipo": "fora_escopo", "mensagem": "...", "metadados": {...}}
```

---

### Melhoria #2: Timeout, Retry + Fallback de Modelo ✅

**Implementação de resiliência para chamadas OpenAI:**

**Arquivos Criados/Modificados:**
- `util/retry.js` - Funções utilitárias:
  - `retry()` - Retry exponencial configurável (default: 2 tentativas, backoff 250ms)
  - `withTimeout()` - Wrapper de timeout usando Promise.race()

- `lib/ai.js` - Atualizado com retry e fallback:
  - Timeout configurável (OPENAI_TIMEOUT_MS = 15000ms)
  - Retry exponencial com até N tentativas (OPENAI_MAX_RETRIES = 2)
  - Fallback automático para modelo secundário se primário falhar
  - Fallback em caso de resposta vazia ou JSON inválido

**Variáveis de Ambiente:**
```bash
OPENAI_MODEL=gpt-4o-mini              # Modelo primário
OPENAI_FALLBACK_MODEL=gpt-4o-mini     # Modelo fallback
OPENAI_TIMEOUT_MS=15000               # Timeout em ms
OPENAI_MAX_RETRIES=2                  # Número de tentativas
```

**Fluxo de Execução:**
1. Tenta modelo primário com retry exponencial
2. Se falhar/timeout/JSON inválido → tenta modelo fallback
3. Se ambos falharem → retorna fallback seguro (tipo: "erro")

**Benefícios:**
- ✅ Resiliência contra timeouts e falhas transitórias
- ✅ Fallback automático entre modelos
- ✅ Backoff exponencial evita sobrecarga
- ✅ Degradação graciosa com mensagens de erro adequadas

---

### Melhoria #4: Logging Seguro + LGPD ✅

**Implementação de auditoria LGPD-compliant com redação de PII:**

**Arquivos Criados/Modificados:**
- `util/safe-log.js` - Sistema de logging seguro:
  - Redação automática de PII (email, telefone, CPF, RG)
  - Pseudonimização de IDs de paciente com HMAC SHA-256
  - Amostragem configurável de logs
  - Truncamento de logs grandes (>2000 chars)
  - Níveis de log (error, warn, info, debug)

- `util/audit.js` - Sistema de auditoria:
  - Registro de interações com IA
  - Flags de escalação e emergência
  - Pseudonimização automática de pacientId
  - Logs com redação de PII em perguntas/respostas

- `routes/ai.js` - Integração de auditoria:
  - Chamada automática após cada resposta
  - Registro de encounterId, patientId, flags

**Variáveis de Ambiente:**
```bash
LOG_LEVEL=info              # error|warn|info|debug
LOG_PII=false              # true = não redige (NUNCA em prod)
LOG_SAMPLE_RATE=1          # 1=100%, 0.1=10%
PSEUDONYM_SALT=secret-salt # Salt para pseudonimização
```

**Exemplo de Log Seguro:**
```
[info] {"pid":"7ee0a289fc37896b","flags":{"escalation":false,"emergency":false}} ai_interaction
```

**Benefícios:**
- ✅ LGPD-compliant: redação automática de dados sensíveis
- ✅ Pseudonimização: IDs hasheados com salt secreto
- ✅ Rastreabilidade: auditoria de todas interações
- ✅ Controle granular: níveis de log e amostragem
- ✅ Performance: truncamento e sampling inteligente

**Testes Realizados:**
```bash
# Log normal (esclarecimento)
[info] {"pid":"7ee0a289fc37896b","flags":{"escalation":false,"emergency":false}} ai_interaction

# Log emergência
[info] {"pid":"7ee0a289fc37896b","flags":{"escalation":false,"emergency":true}} ai_interaction

# Log fora de escopo
[info] {"pid":"7ee0a289fc37896b","flags":{"escalation":true,"emergency":false}} ai_interaction
```

---

### Melhoria #3: Rate Limiting por Paciente/IP ✅

**Implementação de proteção contra abuso com sliding window:**

**Arquivos Criados/Modificados:**
- `util/rate-limit.js` - Sistema de rate limiting:
  - Algoritmo de janela deslizante (sliding window)
  - Limite configurável por paciente (default: 12 req/min)
  - Limite configurável por IP (default: 60 req/min)
  - Limpeza automática de janelas antigas
  - Cálculo de tempo de espera (Retry-After)

- `routes/ai.js` - Integração de rate limiting:
  - Gate de verificação antes de processar requisição
  - Retorna HTTP 429 quando limite excedido
  - Header `Retry-After` com segundos de espera
  - Suporte a X-Forwarded-For para proxies

**Variáveis de Ambiente:**
```bash
RL_PATIENT_PER_MIN=12  # Requisições por minuto por paciente
RL_IP_PER_MIN=60       # Requisições por minuto por IP
```

**Exemplo de Resposta (429):**
```bash
HTTP/1.1 429 Too Many Requests
Retry-After: 23
Content-Type: application/json

{
  "tipo": "erro",
  "mensagem": "Muitas requisições. Tente novamente em 23 segundos.",
  "metadados": {"medico": "", "data_consulta": ""},
  "retryAfterSec": 23
}
```

**Benefícios:**
- ✅ Proteção contra spam e abuso
- ✅ Sliding window: precisão em controle de taxa
- ✅ Isolamento por paciente: um usuário não afeta outros
- ✅ Suporte a proxies: detecta IP real via X-Forwarded-For
- ✅ Cliente amigável: indica tempo de espera exato
- ✅ In-memory: sem dependência de Redis (adequado para single-instance)

**Testes Realizados:**
```bash
# 12 requisições aceitas
Req 1-12: HTTP 200

# A partir da 13ª: bloqueio
Req 13-15: HTTP 429 (Retry-After: 23)

# Pacientes diferentes não se afetam
Paciente 1: bloqueado
Paciente 2: aceito normalmente
```

---

**Próximas Melhorias Planejadas:**
- #5: Políticas Versionáveis (YAML)
- #6: Observabilidade (Métricas + Logs estruturados)
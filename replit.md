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
- `POST /api/ai/answer` - Envia pergunta, recebe resposta com flags (emergency, outOfScope)
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
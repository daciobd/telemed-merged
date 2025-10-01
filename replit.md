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
-   **telemed-docs-automation** (Port 8080): Automação de documentos médicos.

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

**Kit Modular Dr. AI:**
-   **Arquitetura**: Modular e reutilizável com componentes TypeScript, hook customizado e integração com servidor HTTP nativo Node.js.
-   **Funcionalidades**: Consent Gate LGPD, Audit Logging, Scope Detection, Emergency Escalation, Dark Mode, Cooldown Anti-spam, Quick Questions.
-   **API Integrada**: Rotas `/api/ai/answer`, `/api/ai/audit`, `/api/ai/tts`, `/api/ai/stt` configuradas para `fetch()`.
-   **Robustez**: 
    - Saída JSON estruturada e validada com Zod
    - Timeout (15s) + Retry (2x) + Fallback model (OpenAI)
    - Logging seguro LGPD-compliant (truncamento 500 chars + SHA-256 hash)
    - Rate limiting dual-mode: Redis (sliding window ZSET) + in-memory fallback
    - Políticas de segurança YAML versionáveis (37 keywords emergência, 16 sintomas novos, 23 fora de escopo, 18 deny-list)
    - Política de idade de consulta por especialidade (30-120 dias conforme especialidade)
    - Normalização linguística (remove acentos para matching consistente)
    - Observabilidade Prometheus: 9 métricas customizadas (/metrics endpoint)
    - Banco: PostgreSQL com UUID, JSONB, índices otimizados, RLS preparado
    - CI/CD: Secret scan, security audit, linter, E2E tests (Playwright)

## External Dependencies
-   **AWS S3**: Armazenamento seguro de documentos médicos e geração de URLs assinadas.
-   **PostgreSQL**: Banco de dados relacional.
-   **Render**: Plataforma de deployment.
-   **PDFKit**: Geração de documentos PDF.
-   **Handlebars/Mustache**: Templating de documentos PDF.
-   **Playwright**: Testes de ponta a ponta.
-   **Swagger/OpenAPI**: Documentação da API.
-   **Shadcn/ui + Radix UI**: Componentes de UI para o frontend.
-   **Redis**: Key Value Store para cache/filas de chat e rate limiting distribuído (opcional).
-   **Datadog**: Monitoramento e observabilidade.
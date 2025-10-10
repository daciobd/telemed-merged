# TeleMed Platform - Documentação Concisa

## Overview
A Plataforma TeleMed é uma solução unificada de telemedicina, consolidando três aplicações existentes em um monorepo com cinco microserviços prontos para deploy. Ela oferece workflows de consulta, calculadoras médicas, prescrição digital, automação de documentos médicos com integração AWS S3, um sistema de triagem médica com IA (Dr. AI Medical Triage), e módulos plug-and-play para chat em consulta, gestão de pacientes, agendamento real e um widget de suporte. O projeto está completo e pronto para produção, focando em compliance com as regulamentações brasileiras de telemedicina.

## User Preferences
- **Linguagem**: Português brasileiro
- **Comunicação**: Linguagem simples e cotidiana
- **Contexto**: Telemedicina brasileira com compliance CFM

## System Architecture
A plataforma é composta por um monorepo com cinco microserviços Dockerizados, orquestrados para deploy no Render.

**Microserviços:**
-   **telemed-auth-server**: Autenticação JWT e gestão de usuários.
-   **telemed-calculator-api**: Calculadoras e ferramentas médicas.
-   **telemed-prescription-api**: Sistema de prescrições digitais e verificação farmacêutica.
-   **telemed-deploy-ready**: Frontend unificado em React.
-   **telemed-docs-automation**: Automação de documentos médicos (receitas e atestados CFM-compliant em PDF, com integração AWS S3 para URLs assinadas).

**Frontend:**
-   **Framework**: React com TypeScript, React Router, React Query + Context API.
-   **Estilo**: Tailwind CSS + componentes customizados.
-   **UI/UX**: Componentes responsivos, modal de prescrição ANVISA, chat flutuante, filtros de busca, dashboard de métricas em tempo real, e um widget de suporte/ajuda.
-   **Dr. AI Medical Triage**: Interface LGPD-compliant, algoritmo de triagem por pattern-matching, sistema de "Red Flags" para urgências, validação médica e dashboard de métricas.

**Backend:**
-   **Framework**: Express.js + TypeScript.
-   **Autenticação**: JWT + bcrypt.
-   **Banco de Dados**: PostgreSQL com Drizzle ORM.
-   **Documentos**: PDFKit + Handlebars para geração de documentos com templates profissionais e QR Codes de verificação.
-   **Validação**: Zod schemas.

**Infraestrutura e Deploys:**
-   **Deploy**: Render (5 serviços configurados via `render.yaml`) com PostgreSQL gerenciado.
-   **Documentação API**: OpenAPI 3.1 Specification.
-   **Testes Automatizados**: Playwright Smoke Tests com 6 cenários críticos.
-   **CI/CD**: GitHub Actions com Playwright para testes E2E em PRs/pushes.

**Funcionalidades Principais:**
-   **Sistema de Prescrição Digital Completo**: Geração de receitas digitais com busca ANVISA, montagem de posologia, emissão de PDF com QR Code e hash de segurança, e página de verificação para farmácias. Inclui funcionalidade de "Reimprimir Link".
-   **Chat na Consulta + CID-10/CIAP**: Chat flutuante com WebSocket e autocomplete de códigos.
-   **Página "Meus Pacientes"**: Gerenciamento de pacientes.
-   **Agendamento Real**: Integração com APIs de mercado.
-   **Widget de Suporte/Ajuda**: FAQ e sistema de tickets.

## External Dependencies
-   **AWS S3**: Armazenamento seguro de documentos médicos (PDFs) e geração de URLs assinadas.
-   **PostgreSQL**: Banco de dados relacional.
-   **Render**: Plataforma de deployment.
-   **PDFKit**: Biblioteca para geração de documentos PDF.
-   **Handlebars/Mustache**: Para templating de documentos PDF.
-   **Playwright**: Ferramenta para testes de ponta a ponta.
-   **Swagger/OpenAPI**: Para documentação da API.

## Recent Bug Fixes (Oct 10, 2025)

### ❌ Bug: "Cannot read properties of null (reading 'addEventListener')"

**Problema Identificado:**
- Erro JavaScript crítico em `cadastro-medico.html` (arquivo raiz, 398 linhas)
- Múltiplas chamadas a `addEventListener` sem verificação de null
- Linha 389-395 tinha o erro principal: `$('#btn-demo').addEventListener` sem proteção

**Arquivos Corrigidos:**
1. **`cadastro-medico.html`** (arquivo raiz):
   - Linha 313: `crmEl?.addEventListener` - Adicionado optional chaining ✅
   - Linha 319: `ufEl?.addEventListener` - Adicionado optional chaining ✅
   - Linha 357: `$('#btn-clear')?.addEventListener` - Adicionado optional chaining ✅
   - Linha 358: `forEach(el=> { if(el) el.value = ''; })` - Adicionado null check ✅
   - Linha 362: `$('#btn-save-legacy')?.addEventListener` - Adicionado optional chaining ✅
   - Linha 392: `$('#btn-demo')?.addEventListener` - Adicionado optional chaining ✅

2. **`assets/js/cadastro-medico.js`** (arquivo externo robusto criado):
   - IIFE blindado com flag anti-duplicação
   - Helper `on()` seguro para todos os addEventListener
   - Auto-criação de elementos faltantes
   - Usado em `public/cadastro-medico.html`

**Validação:**
- ✅ Teste E2E Playwright passou sem erros
- ✅ Zero erros JavaScript no console
- ✅ Formulário totalmente funcional
- ✅ Redirecionamento funcionando corretamente

**Padrão de Correção:**
```javascript
// ❌ ANTES (quebrava se elemento não existisse)
$('#btn-demo').addEventListener('click', handler);

// ✅ DEPOIS (seguro com optional chaining)
$('#btn-demo')?.addEventListener('click', handler);
```
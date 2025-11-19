# TeleMed Platform - Documentação Concisa

## Overview
A Plataforma TeleMed é uma solução unificada de telemedicina que consolida três aplicações existentes em um monorepo com cinco microserviços. Ela oferece workflows de consulta, calculadoras médicas, prescrição digital, automação de documentos médicos com integração AWS S3, um sistema de triagem médica com IA (Dr. AI Medical Triage), e módulos plug-and-play para chat em consulta, gestão de pacientes, agendamento e um widget de suporte. O projeto está completo e pronto para produção, focado em compliance com as regulamentações brasileiras de telemedicina. Seu objetivo é otimizar a experiência de telemedicina e ser um produto líder no mercado brasileiro.

## User Preferences
- **Linguagem**: Português brasileiro
- **Comunicação**: Linguagem simples e cotidiana
- **Contexto**: Telemedicina brasileira com compliance CFM

## System Architecture
A plataforma é composta por um monorepo com seis microserviços Dockerizados, orquestrados para deploy no Render.

**Microserviços:**
-   **telemed-auth-server**: Autenticação JWT e gestão de usuários.
-   **telemed-calculator-api**: Calculadoras e ferramentas médicas.
-   **telemed-prescription-api**: Sistema de prescrições digitais e verificação farmacêutica.
-   **telemed-deploy-ready**: Frontend unificado em React.
-   **telemed-docs-automation**: Automação de documentos médicos (receitas e atestados CFM-compliant em PDF, com integração AWS S3).
-   **medical-desk-advanced**: Serviço standalone de protocolos clínicos para demonstrações em hospitais.

**Frontend:**
-   **Tecnologias**: React com TypeScript, React Router, React Query + Context API, Tailwind CSS.
-   **UI/UX**: Componentes responsivos, modal de prescrição ANVISA, chat flutuante, dashboard de métricas, widget de suporte, sistema de temas Dark/Light. Dr. AI Medical Triage com interface LGPD-compliant e algoritmo de triagem. Integração de leilão/precificação (BidConnect) com proxy local e feature flag, oferecendo 3 modelos de precificação. Página de consulta modernizada com tabs (Chat, Atendimento, Exames, Receitas) e integração MedicalDesk.
-   **Ferramentas de Teste/Onboarding**: Guia Interativo do Testador (`tester-guide.html`), página de Boas-Vindas (`bem-vindo.html`), ferramentas de QA automatizadas (`test-tour-links.html`, `smoke-test.html`), Pitch Deck para Investidores (`pitchdeck.html`), e guia de testes para médicos (`guia-teste-medico.html`).

**Backend:**
-   **Tecnologias**: Express.js + TypeScript.
-   **Autenticação**: JWT + bcrypt.
-   **Banco de Dados**: PostgreSQL com Drizzle ORM.
-   **Documentos**: PDFKit + Handlebars para geração de documentos com templates profissionais e QR Codes de verificação.
-   **Validação**: Zod schemas.
-   **Gateway Consolidado (`telemed-internal`)**: Serve o frontend estático, atua como proxy para serviços externos e gerencia health endpoints.

**Infraestrutura e Deploys:**
-   **Deploy**: Render (5 serviços configurados via `render.yaml`) com PostgreSQL gerenciado.
-   **Documentação API**: OpenAPI 3.1 Specification.
-   **Testes Automatizados**: Playwright Smoke Tests com cenários críticos.
-   **CI/CD**: GitHub Actions com Playwright para testes E2E.
-   **Mock Auction Standalone**: Serviço mock independente para leilão/precificação.

## External Dependencies
-   **AWS S3**: Armazenamento seguro de documentos médicos (PDFs) e geração de URLs assinadas.
-   **PostgreSQL**: Banco de dados relacional.
-   **Render**: Plataforma de deployment.
-   **PDFKit**: Biblioteca para geração de documentos PDF.
-   **Handlebars**: Para templating de documentos PDF.
-   **Playwright**: Ferramenta para testes de ponta a ponta.
-   **Swagger/OpenAPI**: Para documentação da API.
-   **jsonwebtoken**: Para autenticação JWT no backend.
-   **http-proxy-middleware**: Para proxy reverso no backend.
-   **express-rate-limit**: Para controle de taxa de requisições.
-   **MedicalDesk**: Plataforma externa de gestão clínica, integrada via proxy e sessão JWT.
# TeleMed Platform - Documentação Completa

## Overview
A Plataforma TeleMed é uma solução unificada de telemedicina, consolidando três aplicações existentes em um monorepo com cinco microserviços prontos para deploy. Ela oferece workflows de consulta, calculadoras médicas, prescrição digital, automação de documentos médicos com integração AWS S3, um sistema de triagem médica com IA (Dr. AI Medical Triage), e módulos plug-and-play para chat em consulta, gestão de pacientes, agendamento real e um widget de suporte. O projeto está completo e pronto para produção, focando em compliance com as regulamentações brasileiras de telemedicina.

## User Preferences
- **Linguagem**: Português brasileiro
- **Comunicação**: Linguagem simples e cotidiana
- **Contexto**: Telemedicina brasileira com compliance CFM

## System Architecture
A plataforma é composta por um monorepo com cinco microserviços Dockerizados, orquestrados para deploy no Render.

**Microserviços:**
-   **telemed-auth-server** (Port 3001): Autenticação JWT e gestão de usuários.
-   **telemed-calculator-api** (Port 3002): Calculadoras e ferramentas médicas.
-   **telemed-prescription-api** (Port 3003): Sistema de prescrições digitais e verificação farmacêutica.
-   **telemed-deploy-ready** (Port 3000): Frontend unificado em React.
-   **telemed-docs-automation** (Port 8080): Automação de documentos médicos (receitas e atestados CFM-compliant em PDF, com integração AWS S3 para URLs assinadas).

**Frontend:**
-   **Framework**: React com TypeScript.
-   **Roteamento**: React Router.
-   **Estado**: React Query + Context API.
-   **Estilo**: Tailwind CSS + componentes customizados.
-   **Build**: Vite.
-   **UI/UX**: Componentes responsivos, modal de prescrição ANVISA, chat flutuante, filtros de busca, dashboard de métricas em tempo real, e um widget de suporte/ajuda.
-   **Dr. AI Medical Triage**: Interface LGPD-compliant, algoritmo de triagem por pattern-matching, sistema de "Red Flags" para urgências, validação médica e dashboard de métricas.

**Backend:**
-   **Framework**: Express.js + TypeScript.
-   **Autenticação**: JWT + bcrypt.
-   **Banco de Dados**: PostgreSQL com Drizzle ORM.
-   **Documentos**: PDFKit + Handlebars para geração de documentos com templates profissionais e QR Codes de verificação.
-   **Validação**: Zod schemas.

**Infraestrutura e Deploys:**
-   **Deploy**: Render (5 serviços configurados via `render.yaml`).
-   **Banco de Dados**: PostgreSQL no Render.
-   **Monitoramento**: Health checks configurados.
-   **Documentação API**: OpenAPI 3.1 Specification completa com contratos, schemas, autenticação e suporte a WebSocket.
-   **Testes Automatizados**: Playwright Smoke Tests com 6 cenários críticos (Consulta, Dashboard, Meus Pacientes, CID-10/CIAP, Suporte, Dr. AI), utilizando mocks de rede.

**Funcionalidades Adicionais:**
-   **Chat na Consulta + CID-10/CIAP**: Chat flutuante com suporte WebSocket e autocomplete de códigos CID-10/CIAP.
-   **Página "Meus Pacientes"**: Gerenciamento de pacientes com filtros e ações.
-   **Agendamento Real**: Integração de agendamento com slots e APIs de mercado.
-   **Widget de Suporte/Ajuda**: Botão flutuante com FAQ e sistema de tickets.

## External Dependencies
-   **AWS S3**: Para armazenamento seguro de documentos médicos (PDFs) e geração de URLs assinadas.
-   **PostgreSQL**: Banco de dados relacional para persistência de dados.
-   **Render**: Plataforma de deployment para os microserviços e frontend.
-   **PDFKit**: Biblioteca para geração de documentos PDF.
-   **Handlebars/Mustache**: Para templating de documentos PDF.
-   **Playwright**: Ferramenta para testes de ponta a ponta.
-   **Swagger/OpenAPI**: Para documentação da API.

## TeleMed - Sistema de Prescrição Digital Completo

### 💊 **Funcionalidades Implementadas**
- ✅ **Modal ANVISA**: Busca inteligente de medicamentos por nome/código  
- ✅ **Montagem Receita**: Seleção de medicamentos com posologia completa
- ✅ **Emissão PDF**: Geração de receita digital com links assinados
- ✅ **Integração Consulta**: Substitui prompt() do botão "Nova Prescrição"
- ✅ **Verificação Farmácia**: Página verify-rx.html para validação sem dados clínicos
- ✅ **Template PDF**: rx-template.html profissional com QR Code e hash de segurança

### 🏥 **Verificação para Farmácias**
- **Página**: `verify-rx.html` - Interface dedicada sem dados clínicos
- **Endpoint**: GET `/api/prescriptions/{id}/verify` → `{valid, status, doctor, content_hash}`
- **Segurança**: Apenas metadados mínimos (CRM/UF, hash parcial, timestamp)
- **Estados**: VÁLIDA, EXPIRADA, REVOGADA com visual diferenciado

### 📄 **Template PDF Profissional**
- **Template**: `rx-template.html` - HTML → PDF com Handlebars/Mustache
- **QR Code**: Aponta para `verify-rx.html?rx_id={{rx_id}}`
- **Hash SHA-256**: Conteúdo ordenado `{appointmentId, items[], doctor, issuedAt}`
- **Compliance**: Cabeçalho CFM, assinatura eletrônica, carimbo temporal

### 🔄 **Funcionalidade "Reimprimir Link"**
- **Modal Prescrição**: Botão `data-testid="rx-reprint"` após emitir receita
- **PHR Timeline**: Botão "Reimprimir link" ao lado de "Ver PDF" nas prescrições recentes
- **Endpoint**: POST `/api/prescriptions/{id}/reprint` → gera novo URL assinado
- **UX**: Evita ida/volta ao consultório quando paciente pede "link novo"

### 🚨 **Alertas de Produção (Prometheus)**
```yaml
- alert: TelemedPrescriptionErrorRateHigh
  expr: |
    sum(rate(http_requests_total{route="/api/prescriptions",status=~"5.."}[5m]))
      / sum(rate(http_requests_total{route="/api/prescriptions"}[5m])) > 0.02
  for: 5m
  labels: { severity: page }
  annotations:
    summary: "Erros de prescrição > 2% (5m)"
    description: "Verifique storage/PDF/sign service."

- alert: TelemedPrescriptionLatencyP95High
  expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{route="/api/prescriptions"}[5m])) by (le)) > 2
  for: 10m
  labels: { severity: ticket }
  annotations:
    summary: "p95 de emissão > 2s"
    description: "Monitorar lentidão do gerador de PDF/IO."
```

## 🚀 **STATUS PRODUÇÃO - GO/NO-GO APROVADO**

### ✅ **Checklist Produção Completo**
- **Feature Flags**: prescription.enabled, verify.enabled, chat.enabled, uploads.enabled
- **Segurança**: Headers PDF/verify, SameSite=Lax, HttpOnly, Secure  
- **Secrets**: Rotação concluída + varredura repo, TTL configurado
- **Backups**: PDFs versionados, RPO ≤ 15min, restore testado
- **RBAC**: Médico consulta → emitir/visualizar RX, Farmácia → verify apenas
- **Observabilidade**: Dashboards/alertas carregados (erros %, p95, 429, storage)

### 📊 **KPIs Definidos**
- **eRX Success Rate**: ≥ 98% (2xx /api/prescriptions)
- **p95 Emissão PDF**: ≤ 2s, p99 ≤ 4s  
- **Verify Sucesso**: ≥ 99% (valid/expired, sem 5xx)
- **Reprint Usage**: < 15% das RX em 7 dias

### 🔄 **Plano Rollout**
- **Canário**: 1% (médicos selecionados) → 25% → 100%
- **Guard-rails**: Erro >2% (5m) ou p95 >2s (10m) ⇒ auto-rollback flag
- **Comms**: Macros "link expirado", "403 permissão" 

### 📈 **Métricas Instrumentadas**
- `telemed_prescription_emit_total{status}`
- `telemed_prescription_emit_duration_seconds`
- `telemed_prescription_verify_total{status}`
- `telemed_prescription_reprint_total`
- `telemed_drugs_search_fallback_total`

### 🛡️ **Playbooks Incidentes**
- **PDF 5xx**: Fallback provider + reprocessar + comunicar "reimprimir"
- **ANVISA fora**: Item livre (alerta) + logs fallback
- **Verify 5xx**: Manter eRX + "verifique novamente"
- **Storage indisponível**: Pausar + fila + reemitir

### 🎯 **Compliance LGPD**
- **Chat/anexos**: 12 meses configurável + expurgo
- **Logs auditoria**: 24 meses, acesso restrito, sem conteúdo clínico

### ♿ **Acessibilidade**
- `aria-live="polite"` nos toasts
- Foco retorna ao botão modal
- `data-testid` completo (rx-emit, rx-link, rx-reprint)

### 📄 **Guia de Teste Imprimível**
- **Página**: `guia-teste.html` - Layout A4 otimizado para impressão
- **Conteúdo**: Passo-a-passo para paciente e médico, cenários de teste
- **QR Customizável**: `?faq=https://SEU_DOMINIO/faq.html` para link personalizado
- **Fallbacks**: Múltiplos serviços de QR + fallback para link texto
- **Layout**: 2 colunas, checklist completo, visual profissional

---

**🎉 PLATAFORMA TELEMEDICINA ENTERPRISE - PRODUCTION READY!**

*Status: Setembro 2025 - **GO/NO-GO APROVADO** - Sistema completo pronto para launch 🚀*
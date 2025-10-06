# TeleMed — Template de PR

## Resumo
> O que muda e por quê (≤5 linhas)

## Tipo de mudança
- [ ] Bugfix
- [ ] Feature
- [ ] Refatoração
- [ ] **ALTERAÇÃO DE CONTRATO** (muda API/rotas/esquema) — descrever impacto e migração

---

## ✅ Checklist obrigatório

### Telemetria
- [ ] **Não** registra PII nem texto digitado (apenas eventos técnicos)
- [ ] `version: 'pilot-r1'` presente quando aplicável
- [ ] Endpoints **não** quebram: `POST /api/telemetry/event` e `GET /api/telemetry/metrics`

### Segurança
- [ ] Anti-injeção **intacto** (validações de entrada/Zod ou equivalentes)
- [ ] **Rate limit** mantido (e/ou reforçado)
- [ ] Sem segredos/keys no código/console (.env/vars)

### LGPD / Logs
- [ ] Logs **minimizados** (sem e-mail/telefone/CPF/token)
- [ ] Console só técnico (sem texto livre do usuário)

### Políticas YAML (backend)
- [ ] `fora_escopo` **preservado**
- [ ] `escala_emergencia` **preservado**
- [ ] `consulta_expirada` por **especialidade** **preservado/atualizado** (se aplicável)

### Frontend (UX/A11y)
- [ ] Inputs/botões com **label/aria** e foco visível
- [ ] **Enter** envia / **Shift+Enter** quebra linha (chat)
- [ ] Autoscroll do chat após novas mensagens
- [ ] CTAs coerentes (sem `target="_blank"` sem `rel="noopener"`)

---

## Testes
- [ ] Unitários/integração atualizados (quando aplicável)
- [ ] E2E (Playwright) cobre o fluxo principal (quando aplicável)
- [ ] Dados **fake** em testes (sem PII)

### Passos de validação manual (copiáveis)
1) `/public/admin-telemetry.html` → **Ativar Telemetria**
2) **Home** → clique **Começar Demo** / **Assistente Dr. AI**
3) **Network**: `POST /api/telemetry/event` = 200 `{ ok:true }` (com `version:'pilot-r1'`)
4) **Dashboard** `/dashboard-piloto.html` → KPIs sobem

---

## Evidências
- Screenshots / gravações / dumps de `GET /api/telemetry/metrics?range=24h`

## Impacto / Rollback
- Impactos conhecidos:
- Plano de rollback seguro:

## Itens relacionados
- Issues/Tasks: #123, #456
- Docs impactados: (links)

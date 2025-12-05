# TeleMed - Decisão de Páginas

## Legenda de Decisões

| Decisão | Significado |
|---------|-------------|
| **MANTER** | Página de produção (fluxo real de paciente/médico/admin) |
| **MANTER_DEMO** | Útil para demonstração/teste interno, não expor em menu |
| **REMOVER** | Duplicado, preview, versão antiga sem uso |
| **ARQUIVAR** | Mover para /archive, não deve estar na navegação |

---

## 1. PÁGINAS DE PRODUÇÃO (MANTER)

### Portal de Entrada
| URL / Arquivo | Tipo | Uso Atual | Decisão | Observações |
|---------------|------|-----------|---------|-------------|
| `/` | Home | Portal inicial | MANTER | Links: paciente, médico, admin |
| `/escolha-perfil.html` | Paciente | Escolha de perfil | MANTER | Fluxo paciente |
| `/hub.html` | Admin | Hub administrativo | MANTER | Clínicas e admin |
| `/healthz` | Sistema | Health check | MANTER | Monitoramento |

### Consultório Virtual (React SPA)
| URL / Arquivo | Tipo | Uso Atual | Decisão | Observações |
|---------------|------|-----------|---------|-------------|
| `/consultorio/login` | Consultório | Login médico | MANTER | Produção |
| `/consultorio/dashboard` | Consultório | Dashboard | MANTER | Produção |
| `/consultorio/marketplace` | Consultório | Marketplace | MANTER | Produção |
| `/consultorio/minhas-consultas` | Consultório | Consultas | MANTER | Produção |
| `/consultorio/consultas/:id` | Consultório | Detalhes | MANTER | Produção |
| `/consultorio/agenda` | Consultório | Agenda | MANTER | Produção |
| `/consultorio/settings` | Consultório | Configurações | MANTER | Produção |
| `/consultorio/dr/:customUrl` | Consultório | Página pública | MANTER | Agendamento direto |

### Fluxo Paciente (Classic)
| URL / Arquivo | Tipo | Uso Atual | Decisão | Observações |
|---------------|------|-----------|---------|-------------|
| `/paciente/como-funciona.html` | Paciente | Onboarding | MANTER | Fluxo paciente |
| `/cadastro.html` | Paciente | Cadastro | MANTER | Registro paciente |
| `/sala-de-espera.html` | Paciente | Espera | MANTER | Aguardando consulta |
| `/phr.html` | Paciente | Prontuário | MANTER | Registro de saúde |
| `/registro-saude.html` | Paciente | Histórico | MANTER | Dados de saúde |

### Fluxo Médico (Classic)
| URL / Arquivo | Tipo | Uso Atual | Decisão | Observações |
|---------------|------|-----------|---------|-------------|
| `/medico/como-funciona.html` | Médico | Onboarding | MANTER | Fluxo médico |
| `/cadastro-medico.html` | Médico | Cadastro | MANTER | Registro médico |
| `/consulta.html` | Médico | Atendimento | MANTER | Tela de consulta |
| `/dashboard-medico.html` | Médico | Dashboard | MANTER | Painel clássico |
| `/meus-pacientes.html` | Médico | Pacientes | MANTER | Lista de pacientes |

### Funcionalidades Core
| URL / Arquivo | Tipo | Uso Atual | Decisão | Observações |
|---------------|------|-----------|---------|-------------|
| `/avaliacao.html` | Feedback | Avaliação | MANTER | Coleta feedback |
| `/obrigado.html` | Feedback | Agradecimento | MANTER | Pós-avaliação |
| `/termos-privacidade.html` | Legal | Termos | MANTER | Obrigatório |
| `/404.html` | Sistema | Erro | MANTER | Página de erro |
| `/status.html` | Sistema | Status | MANTER | Status do sistema |
| `/rx-template.html` | Receita | Template | MANTER | Geração de receita |
| `/verify-rx.html` | Receita | Verificação | MANTER | Validação receita |

### Dr. AI (Triagem)
| URL / Arquivo | Tipo | Uso Atual | Decisão | Observações |
|---------------|------|-----------|---------|-------------|
| `/dr-ai.html` | Dr. AI | Triagem IA | MANTER | Funcionalidade principal |

---

## 2. PÁGINAS DE DEMONSTRAÇÃO (MANTER_DEMO)

| URL / Arquivo | Tipo | Uso Atual | Decisão | Observações |
|---------------|------|-----------|---------|-------------|
| `/demo.html` | Demo | Hub de demos | MANTER_DEMO | Links para todas demos |
| `/demo-paciente.html` | Demo | Demo paciente | MANTER_DEMO | Apresentação interna |
| `/demo-medico.html` | Demo | Demo médico | MANTER_DEMO | Apresentação interna |
| `/dr-ai-demo.html` | Demo | Demo Dr. AI | MANTER_DEMO | Prototipagem IA |
| `/dr-ai-modular.html` | Demo | Dr. AI modular | MANTER_DEMO | Versão modular |
| `/dr-ai-assistant.html` | Demo | Assistente | MANTER_DEMO | Assistente IA |
| `/dr-ai-dashboard.html` | Demo | Dashboard IA | MANTER_DEMO | Métricas IA |
| `/scribe-demo.html` | Demo | Scribe/CIDs | MANTER_DEMO | Transcrição médica |
| `/guia-teste.html` | Demo | Guia QA | MANTER_DEMO | Para testadores |
| `/toast-demo.html` | Demo | Toast demo | MANTER_DEMO | Componente UI |
| `/login.html` | Demo | Login clássico | MANTER_DEMO | Fallback login |
| `/landing.html` | Demo | Landing alt | MANTER_DEMO | Landing alternativa |

---

## 3. PÁGINAS A REMOVER

### Pasta /preview/ (37 arquivos) - REMOVER TODA
| URL / Arquivo | Decisão | Motivo |
|---------------|---------|--------|
| `/preview/agenda-avancada.html` | REMOVER | Versão antiga |
| `/preview/agenda-medica.html` | REMOVER | Versão antiga |
| `/preview/agenda-original.html` | REMOVER | Versão antiga |
| `/preview/cadastro.html` | REMOVER | Duplicado |
| `/preview/centro-de-testes.html` | REMOVER | Preview |
| `/preview/como-funciona.html` | REMOVER | Duplicado |
| `/preview/consulta-original.html` | REMOVER | Versão antiga |
| `/preview/consulta-por-valor-corrigida.html` | REMOVER | Preview |
| `/preview/contato.html` | REMOVER | Não usado |
| `/preview/dashboard.html` | REMOVER | Duplicado |
| `/preview/demo-responsivo.html` | REMOVER | Preview |
| `/preview/dr-ai-corrigido-static.html` | REMOVER | Versão antiga |
| `/preview/dr-ai-demo.html` | REMOVER | Duplicado |
| `/preview/dr-ai.html` | REMOVER | Duplicado |
| `/preview/enhanced-teste.html` | REMOVER | Teste |
| `/preview/equipe-medica.html` | REMOVER | Não usado |
| `/preview/faq.html` | REMOVER | Não usado |
| `/preview/feedback-medico.html` | REMOVER | Preview |
| `/preview/guia-orientacao.html` | REMOVER | Preview |
| `/preview/index.html` | REMOVER | Preview hub |
| `/preview/login.html` | REMOVER | Duplicado |
| `/preview/meus-pacientes-original.html` | REMOVER | Versão antiga |
| `/preview/mobile.html` | REMOVER | Preview |
| `/preview/perfil-medico.html` | REMOVER | Preview |
| `/preview/politica-privacidade.html` | REMOVER | Duplicado |
| `/preview/precos.html` | REMOVER | Duplicado |
| `/preview/precos-themed.html` | REMOVER | Preview |
| `/preview/privacidade.html` | REMOVER | Duplicado |
| `/preview/recuperar-senha.html` | REMOVER | Preview |
| `/preview/registro-saude.html` | REMOVER | Duplicado |
| `/preview/registro-saude-original.html` | REMOVER | Versão antiga |
| `/preview/sala-de-espera.html` | REMOVER | Duplicado |
| `/preview/sobre-themed.html` | REMOVER | Preview |
| `/preview/telemonitoramento-enfermagem.html` | REMOVER | Preview |
| `/preview/termos-de-uso.html` | REMOVER | Duplicado |
| `/preview/test-bidding-flow.html` | REMOVER | Teste |
| `/preview/test-bid-integration.html` | REMOVER | Teste |
| `/preview/triagem-psiquiatrica.html` | REMOVER | Preview |

### Pasta /public/ (13 arquivos) - REMOVER
| URL / Arquivo | Decisão | Motivo |
|---------------|---------|--------|
| `/public/admin-flags.html` | REMOVER | Duplicado |
| `/public/admin-telemetry.html` | REMOVER | Não usado |
| `/public/consent-banner.html` | REMOVER | Componente |
| `/public/consulta-demo.html` | REMOVER | Demo antiga |
| `/public/consulta-detalhe-demo.html` | REMOVER | Demo antiga |
| `/public/dashboard-piloto.html` | REMOVER | Duplicado |
| `/public/dr-ai-demo.html` | REMOVER | Duplicado |
| `/public/dr-ai-demo-intro.html` | REMOVER | Duplicado |
| `/public/master-demo.html` | REMOVER | Demo antiga |
| `/public/minhas-consultas-demo.html` | REMOVER | Demo antiga |
| `/public/presentations.html` | REMOVER | Não usado |
| `/public/termos-privacidade.html` | REMOVER | Duplicado |
| `/public/toast-demo.html` | REMOVER | Duplicado |

### Pasta /demo-ativo/ (3 arquivos) - REMOVER
| URL / Arquivo | Decisão | Motivo |
|---------------|---------|--------|
| `/demo-ativo/configuracoes.html` | REMOVER | Roteiro antigo |
| `/demo-ativo/roteiro-1pagina.html` | REMOVER | Roteiro antigo |
| `/demo-ativo/roteiro-print.html` | REMOVER | Roteiro antigo |

### Diretórios Duplicados - REMOVER (manter apenas .html)
| Diretório | Manter | Remover |
|-----------|--------|---------|
| `/sala-de-espera/` | `sala-de-espera.html` | `/sala-de-espera/index.html` |
| `/consulta/` | `consulta.html` | `/consulta/index.html` |
| `/cadastro/` | `cadastro.html` | `/cadastro/index.html` |
| `/agenda/` | `agenda.html` | `/agenda/index.html` |
| `/meus-pacientes/` | `meus-pacientes.html` | `/meus-pacientes/index.html` |
| `/dr-ai/` | `dr-ai.html` | `/dr-ai/index.html` |
| `/como-funciona/` | (avaliar) | `/como-funciona/index.html` |
| `/dashboard/` | (avaliar) | `/dashboard/index.html` |
| `/centro-de-testes/` | (avaliar) | `/centro-de-testes/index.html` |
| `/precos/` | (avaliar) | `/precos/index.html` |

### Páginas Órfãs - REMOVER
| URL / Arquivo | Decisão | Motivo |
|---------------|---------|--------|
| `/admin-flags.html` | REMOVER | Não usado |
| `/dashboard-piloto.html` | REMOVER | Versão antiga |
| `/download.html` | REMOVER | Não usado |
| `/enhanced/index.html` | REMOVER | Não usado |
| `/example-docs-integration.html` | REMOVER | Exemplo antigo |
| `/example-integration.html` | REMOVER | Exemplo antigo |
| `/exemplo-encerrar-consulta.html` | REMOVER | Exemplo antigo |
| `/gestao-avancada/index.html` | REMOVER | Não usado |
| `/meus-pacientes-react.html` | REMOVER | Versão duplicada |
| `/phr-react.html` | REMOVER | Versão duplicada |
| `/pos-consulta-feedback.html` | REMOVER | Não usado |
| `/react-app/index.html` | REMOVER | App alternativo |
| `/video.html` | REMOVER | Não usado |
| `/demo-responsivo/index.html` | REMOVER | Duplicado |
| `/medico/index.html` | REMOVER | Duplicado |
| `/paciente/cadastro/sucesso.html` | REMOVER | Não usado |
| `/paciente/pedido.html` | REMOVER | Não usado |

---

## 4. RESUMO EXECUTIVO

| Categoria | Quantidade | Ação |
|-----------|-----------|------|
| MANTER (Produção) | 35 páginas | Nenhuma |
| MANTER_DEMO | 12 páginas | Nenhuma |
| REMOVER | 70+ arquivos | Excluir |

### Pastas a Remover Completamente
```bash
rm -rf telemed-classic/preview/
rm -rf telemed-classic/public/
rm -rf telemed-classic/demo-ativo/
rm -rf telemed-classic/sala-de-espera/
rm -rf telemed-classic/consulta/
rm -rf telemed-classic/cadastro/
rm -rf telemed-classic/agenda/
rm -rf telemed-classic/meus-pacientes/
rm -rf telemed-classic/dr-ai/
rm -rf telemed-classic/como-funciona/
rm -rf telemed-classic/dashboard/
rm -rf telemed-classic/centro-de-testes/
rm -rf telemed-classic/precos/
rm -rf telemed-classic/enhanced/
rm -rf telemed-classic/gestao-avancada/
rm -rf telemed-classic/react-app/
rm -rf telemed-classic/demo-responsivo/
rm -rf telemed-classic/medico/
rm -rf telemed-classic/paciente/
```

---

## 5. CREDENCIAIS DE TESTE

| Sistema | Email | Senha | URL |
|---------|-------|-------|-----|
| Consultório Virtual | medico@demo.com | Senha123! | /consultorio/login |

---

**Última atualização:** Dezembro 2024

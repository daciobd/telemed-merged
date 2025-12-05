# TeleMed - Mapa Completo de Páginas e Links

## Estrutura de Navegação Principal

```
/ (index.html)
├── 👤 Sou Paciente → /escolha-perfil.html
│   ├── Demo Paciente → /demo-paciente.html
│   └── Demo Médico → /demo-medico.html
├── 🩺 Sou Médico → /consultorio/login (React SPA)
│   └── Após login → /consultorio/dashboard
└── 🏥 Sou Clínica/Admin → /hub.html
```

---

## 1. PÁGINAS EM USO (Fluxo Principal)

### Portal de Entrada
| URL | Descrição | Status |
|-----|-----------|--------|
| `/` | Página inicial com 3 botões de escolha | ✅ ATIVO |
| `/escolha-perfil.html` | Escolha entre Demo Paciente/Médico | ✅ ATIVO |
| `/hub.html` | Hub administrativo e de testes | ✅ ATIVO |
| `/healthz` | Health check do servidor | ✅ ATIVO |

### Consultório Virtual (React SPA - Teal Theme)
| URL | Descrição | Status |
|-----|-----------|--------|
| `/consultorio/login` | Login do médico | ✅ ATIVO |
| `/consultorio/dashboard` | Dashboard principal | ✅ ATIVO |
| `/consultorio/marketplace` | Marketplace de consultas | ✅ ATIVO |
| `/consultorio/minhas-consultas` | Consultas do médico | ✅ ATIVO |
| `/consultorio/consultas/:id` | Detalhes da consulta | ✅ ATIVO |
| `/consultorio/agenda` | Agenda do médico | ✅ ATIVO |
| `/consultorio/settings` | Configurações | ✅ ATIVO |
| `/consultorio/dr/:customUrl` | Página pública do médico | ✅ ATIVO |

### Demos e Testes
| URL | Descrição | Status |
|-----|-----------|--------|
| `/demo-paciente.html` | Demo do fluxo paciente | ✅ ATIVO |
| `/demo-medico.html` | Demo do fluxo médico | ✅ ATIVO |
| `/demo.html` | Demo geral (links para tudo) | ✅ ATIVO |

### Fluxo do Paciente (Classic)
| URL | Descrição | Status |
|-----|-----------|--------|
| `/paciente/como-funciona.html` | Como funciona para paciente | ✅ ATIVO |
| `/cadastro.html` | Cadastro de paciente | ✅ ATIVO |
| `/sala-de-espera.html` | Sala de espera do paciente | ✅ ATIVO |
| `/phr.html` | Prontuário do paciente | ✅ ATIVO |
| `/registro-saude.html` | Registro de saúde | ✅ ATIVO |

### Fluxo do Médico (Classic)
| URL | Descrição | Status |
|-----|-----------|--------|
| `/medico/como-funciona.html` | Como funciona para médico | ✅ ATIVO |
| `/cadastro-medico.html` | Cadastro de médico | ✅ ATIVO |
| `/dashboard-medico.html` | Dashboard médico clássico | ✅ ATIVO |
| `/meus-pacientes.html` | Lista de pacientes | ✅ ATIVO |
| `/consulta.html` | Tela de consulta | ✅ ATIVO |

### Avaliação e Feedback
| URL | Descrição | Status |
|-----|-----------|--------|
| `/avaliacao.html` | Formulário de avaliação | ✅ ATIVO |
| `/obrigado.html` | Página de agradecimento | ✅ ATIVO |
| `/feedback.html` | Feedback geral | ✅ ATIVO |

### Dr. AI (Triagem IA)
| URL | Descrição | Status |
|-----|-----------|--------|
| `/dr-ai.html` | Dr. AI principal | ✅ ATIVO |
| `/dr-ai-demo.html` | Demo do Dr. AI | ✅ ATIVO |
| `/dr-ai-modular.html` | Versão modular | ✅ ATIVO |
| `/dr-ai-assistant.html` | Assistente Dr. AI | ✅ ATIVO |
| `/dr-ai-dashboard.html` | Dashboard Dr. AI | ✅ ATIVO |

---

## 2. PÁGINAS DUPLICADAS/ALTERNATIVAS (Diretórios)

Estas páginas existem tanto como `.html` quanto como `diretório/index.html`:

| Arquivo .html | Diretório/index.html | Recomendação |
|---------------|---------------------|--------------|
| `/sala-de-espera.html` | `/sala-de-espera/index.html` | Manter .html, remover diretório |
| `/consulta.html` | `/consulta/index.html` | Manter .html, remover diretório |
| `/cadastro.html` | `/cadastro/index.html` | Manter .html, remover diretório |
| `/agenda.html` | `/agenda/index.html` | Manter .html, remover diretório |
| `/meus-pacientes.html` | `/meus-pacientes/index.html` | Manter .html, remover diretório |
| `/dr-ai.html` | `/dr-ai/index.html` | Manter .html, remover diretório |

---

## 3. PÁGINAS FORA DE USO (Candidatas a Remoção)

### Preview/Desenvolvimento (pasta /preview/)
Estas páginas são versões de teste/preview que não são acessadas em produção:

```
/preview/agenda-avancada.html
/preview/agenda-medica.html
/preview/agenda-original.html
/preview/cadastro.html
/preview/centro-de-testes.html
/preview/como-funciona.html
/preview/consulta-original.html
/preview/consulta-por-valor-corrigida.html
/preview/contato.html
/preview/dashboard.html
/preview/demo-responsivo.html
/preview/dr-ai-corrigido-static.html
/preview/dr-ai-demo.html
/preview/dr-ai.html
/preview/enhanced-teste.html
/preview/equipe-medica.html
/preview/faq.html
/preview/feedback-medico.html
/preview/guia-orientacao.html
/preview/index.html
/preview/login.html
/preview/meus-pacientes-original.html
/preview/mobile.html
/preview/perfil-medico.html
/preview/politica-privacidade.html
/preview/precos.html
/preview/precos-themed.html
/preview/privacidade.html
/preview/recuperar-senha.html
/preview/registro-saude.html
/preview/registro-saude-original.html
/preview/sala-de-espera.html
/preview/sobre-themed.html
/preview/telemonitoramento-enfermagem.html
/preview/termos-de-uso.html
/preview/test-bidding-flow.html
/preview/test-bid-integration.html
/preview/triagem-psiquiatrica.html
```

**Recomendação:** ⚠️ Mover toda pasta `/preview/` para backup ou remover

### Pasta /public/ (Demos internos)
```
/public/admin-flags.html
/public/admin-telemetry.html
/public/consent-banner.html
/public/consulta-demo.html
/public/consulta-detalhe-demo.html
/public/dashboard-piloto.html
/public/dr-ai-demo.html
/public/dr-ai-demo-intro.html
/public/master-demo.html
/public/minhas-consultas-demo.html
/public/presentations.html
/public/termos-privacidade.html
/public/toast-demo.html
```

**Recomendação:** ⚠️ Avaliar se ainda são usados para demos

### Pasta /demo-ativo/ (Roteiros)
```
/demo-ativo/configuracoes.html
/demo-ativo/roteiro-1pagina.html
/demo-ativo/roteiro-print.html
```

**Recomendação:** ⚠️ Avaliar utilidade

### Páginas Órfãs (sem links apontando para elas)
```
/404.html - Página de erro (manter)
/admin-flags.html - Flags de admin (avaliar)
/dashboard-piloto.html - Dashboard piloto antigo (remover?)
/download.html - Downloads (avaliar)
/enhanced/index.html - Versão enhanced (remover?)
/example-docs-integration.html - Exemplo de integração (remover?)
/example-integration.html - Exemplo de integração (remover?)
/exemplo-encerrar-consulta.html - Exemplo (remover?)
/gestao-avancada/index.html - Gestão avançada (avaliar)
/guia-teste.html - Guia de teste (manter para QA)
/landing.html - Landing alternativa (remover?)
/login.html - Login clássico (manter como fallback)
/meus-pacientes-react.html - Versão React (avaliar)
/phr-react.html - PHR versão React (avaliar)
/pos-consulta-feedback.html - Feedback pós-consulta (avaliar)
/precos/index.html - Página de preços (manter)
/react-app/index.html - App React alternativo (remover?)
/rx-template.html - Template de receita (interno)
/scribe-demo.html - Demo do Scribe (manter para demos)
/status.html - Página de status (manter)
/termos-privacidade.html - Termos (manter)
/toast-demo.html - Demo de toasts (desenvolvimento)
/verify-rx.html - Verificação de receita (manter)
/video.html - Página de vídeo (avaliar)
```

---

## 4. PÁGINAS ESSENCIAIS (Não Remover)

### Infraestrutura
- `/healthz` - Health check
- `/404.html` - Página de erro
- `/status.html` - Status do sistema
- `/termos-privacidade.html` - Termos legais

### Funcionalidades Core
- `/rx-template.html` - Template de receita médica
- `/verify-rx.html` - Verificação de receita
- `/scribe-demo.html` - Demo do Scribe/CIDs

---

## 5. RESUMO DE LIMPEZA RECOMENDADA

| Ação | Quantidade | Impacto |
|------|-----------|---------|
| Remover pasta `/preview/` | 37 arquivos | Baixo (desenvolvimento) |
| Avaliar pasta `/public/` | 13 arquivos | Baixo (demos internos) |
| Remover diretórios duplicados | 6 diretórios | Baixo (já existem .html) |
| Avaliar páginas órfãs | ~15 arquivos | Médio (verificar uso) |

**Total de páginas que podem ser removidas:** ~60-70 arquivos

---

## 6. CREDENCIAIS DE TESTE

### Consultório Virtual (React)
- **Email:** medico@demo.com
- **Senha:** Senha123!
- **Acesso:** /consultorio/login

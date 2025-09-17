# 🩺 TeleMed Consulta - Guia do Paciente Teste

**Bem-vindo ao programa de testes da plataforma TeleMed!** Este guia passo a passo vai te orientar em cada etapa do processo de consulta médica online.

## 📋 Antes de Começar

### O que você precisa:
- ✅ Computador ou celular com câmera e microfone
- ✅ Conexão estável com a internet  
- ✅ Navegador atualizado (Chrome, Firefox, Safari, Edge)
- ✅ 15-30 minutos disponíveis para o teste completo

### Importante saber:
- 🔒 **Seus dados ficam seguros**: Armazenados localmente no navegador durante o teste
- 🆔 **Patient ID**: Você receberá um código único para suas consultas
- 💰 **Sistema BID**: Você propõe um valor e o médico decide se aceita
- 🤖 **Dr. AI**: Inteligência artificial para sugerir a especialidade adequada

---

## 🚀 PASSO 1: Acessar a Plataforma

### 1.1 Entre na página inicial
- Acesse o link fornecido pela equipe TeleMed
- Você verá a tela de **"Bem-vindo ao TeleMed Consulta"**
- Leia as informações sobre o programa de testes

### 1.2 Vá para a plataforma principal
- Clique no botão **"Vamos lá →"** 
- Você será direcionado para a landing principal
- Explore as opções disponíveis para pacientes

---

## 📝 PASSO 2: Fazer seu Cadastro

### 2.1 Iniciar cadastro
- Na landing, procure por **"Cadastro de Paciente"** ou **"Fazer cadastro"**
- Clique para abrir o formulário de cadastro
- Você verá a tela com o título **"TeleMed — Cadastro"**

### 2.2 Preencher seus dados
**Dados pessoais básicos:**
- Nome completo
- Email (use um email real para receber notificações)
- Telefone (com DDD)
- Data de nascimento
- CPF

**Endereço:**
- CEP (o sistema pode autocompletar o endereço)
- Rua e número
- Cidade e estado

**Informações médicas (opcional mas recomendado):**
- Alergias conhecidas
- Medicamentos em uso
- Condições médicas existentes
- Preferências de consulta

### 2.3 Finalizar cadastro
- Confira todos os dados preenchidos
- Clique em **"Finalizar Cadastro"**
- Aguarde a confirmação do sistema

### 2.4 Anotar seu Patient ID
- ✨ **MUITO IMPORTANTE**: Na tela de sucesso, você receberá seu **Patient ID**
- 📋 **Copie e guarde este código** - você precisará dele para todas as consultas
- Opções disponíveis:
  - Clique em **"Copiar ID"** para copiar automaticamente
  - Anote o código em um local seguro
  - Tire uma foto da tela

---

## 🔍 PASSO 3: Entender o Sistema (Como Funciona)

### 3.1 Acessar explicação do fluxo
- Na tela de sucesso, ou navegando pelo menu, acesse **"Como funciona (Paciente)"**
- Leia o fluxo completo:
  1. ✅ Faça seu cadastro
  2. 🎯 Crie um **pedido de consulta (BID)**
  3. ⏳ Aguarde na **Sala de Espera** até o médico aceitar
  4. 🏥 Entre na **Sala da Consulta** quando chamado

### 3.2 Sistema BID (Bidding)
- **BID = Proposta de Valor**: Você propõe quanto pode pagar pela consulta
- O médico vê sua proposta e decide se aceita
- Sistema flexível que se adapta às suas possibilidades

---

## 🎯 PASSO 4: Criar seu Pedido de Consulta

### 4.1 Acessar formulário de pedido
- Clique em **"Fazer pedido de consulta"** ou similar
- Você será direcionado para `/paciente/pedido`
- Seu Patient ID será preenchido automaticamente

### 4.2 Preencher dados da consulta

**Especialidade médica:**
- Clique no campo **"Especialidade"**
- Escolha entre as opções:
  - Clínica Geral (para consultas gerais, check-ups)
  - Cardiologia (coração e sistema cardiovascular)  
  - Dermatologia (pele, cabelo, unhas)
  - *Outras especialidades disponíveis conforme médicos online*

**💡 Dica**: Se não souber qual especialidade, o **Dr. AI** pode ajudar! Procure pela opção de sugestão automática.

**Valor máximo (R$):**
- Digite o valor máximo que pode pagar
- Exemplos: R$ 80,00 | R$ 150,00 | R$ 250,00
- Seja realista com suas possibilidades
- Lembre-se: valores mais altos têm maior chance de aceitação rápida

**Tipo de consulta:**
- **Imediata**: Quer ser atendido agora (sujeito a disponibilidade)
- **Agendada**: Prefere marcar para outro horário

### 4.3 Enviar pedido
- Confira todos os dados
- Clique em **"Enviar Pedido"**
- Aguarde confirmação do sistema
- Anote o **ID do pedido** se fornecido

---

## ⏳ PASSO 5: Aguardar na Sala de Espera

### 5.1 Acessar sala de espera
- Após enviar o pedido, vá para **"Sala de Espera"**
- URL: `/sala-de-espera/`
- Mantenha essa página aberta

### 5.2 O que acontece na sala de espera
- 👀 **Médicos visualizam seu pedido** em tempo real
- ⏰ **Aguarde pacientemente** - pode levar alguns minutos
- 🔔 **Fique atento às notificações** do sistema
- 📱 **Não feche a página** - você pode perder a chamada

### 5.3 Status possíveis
- **"Aguardando médico..."**: Pedido enviado, esperando aceitação
- **"Médico encontrado!"**: Um médico aceitou sua consulta
- **"Preparando sala..."**: Sistema configurando a videochamada
- **"Pronto para consulta"**: Pode entrar na sala

### 5.4 Preparar-se tecnicamente
Enquanto espera, verifique:
- 📹 **Câmera funcionando** (teste fazendo uma selfie)
- 🎤 **Microfone funcionando** (fale e veja se capta som)
- 🔊 **Som do computador** ligado
- 💡 **Iluminação adequada** no ambiente
- 📶 **Internet estável** (teste assistindo um vídeo)

---

## 🏥 PASSO 6: Participar da Consulta

### 6.1 Entrar na sala da consulta
- Quando chamado, clique em **"Entrar na Consulta"**
- Ou acesse diretamente `/consulta/`
- Permita acesso à câmera e microfone quando solicitado

### 6.2 Interface da consulta
Você verá uma tela com:

**Área de vídeo:**
- 📹 **Vídeo do médico** (área principal)
- 👤 **Sua câmera** (canto da tela, menor)
- 🎛️ **Controles**: microfone, câmera, chat

**Ferramentas disponíveis:**
- 🖥️ **Medical Desk Advance**: Médico pode acessar protocolos clínicos
- 📋 **ReceitaCerta**: Para prescrições digitais
- 💬 **Chat de texto**: Para complementar a conversa

### 6.3 Durante a consulta

**Como se comportar:**
- 😊 **Seja natural e educado**
- 🗣️ **Fale claramente** e próximo ao microfone
- 👁️ **Olhe para a câmera** quando falar (não para a tela)
- ⏱️ **Respeite o tempo** - consultas têm duração estimada

**Informações importantes:**
- 📋 **Descreva seus sintomas** com detalhes
- 💊 **Mencione medicamentos** que já usa
- 🏥 **Histórico médico** relevante
- ❓ **Faça perguntas** - tire todas as dúvidas

### 6.4 Recursos durante a consulta
- **Chat de texto**: Para enviar informações por escrito
- **Compartilhamento**: Médico pode mostrar imagens ou documentos
- **Gravação**: Pode ser disponibilizada (se autorizada)

---

## 📄 PASSO 7: Finalizar a Consulta

### 7.1 Encerramento
- Médico indicará quando a consulta está terminando
- Confirme se todas suas dúvidas foram esclarecidas
- Anote orientações importantes

### 7.2 Documentos médicos
Se necessário, o médico pode gerar:
- 📋 **Receita médica** (digital, válida legalmente)
- 📄 **Atestado médico** (se aplicável)
- 📊 **Relatório da consulta** (resumo do atendimento)

### 7.3 Próximos passos
- 🔄 **Reagendamento**: Se precisar de retorno
- 💊 **Receitas**: Como acessar medicamentos prescritos
- 📞 **Contato**: Como falar com o médico novamente

---

## 🛟 PASSO 8: Suporte e Problemas Técnicos

### 8.1 Problemas comuns e soluções

**Câmera não funciona:**
- ✅ Verifique permissões do navegador
- ✅ Feche outros programas que usam câmera
- ✅ Atualize a página e tente novamente

**Som com problemas:**
- ✅ Verifique volume do sistema
- ✅ Teste com fones de ouvido
- ✅ Feche outras abas com áudio

**Internet lenta:**
- ✅ Feche outras abas e programas
- ✅ Aproxime-se do roteador WiFi
- ✅ Use cabo de rede se possível

**Página não carrega:**
- ✅ Atualize a página (F5)
- ✅ Limpe cache do navegador
- ✅ Tente outro navegador

### 8.2 Canais de suporte
- 📧 **Email**: suporte@telemed.app
- 💬 **Chat**: Botão "Ajuda" na plataforma
- 📞 **Telefone**: Número fornecido pela equipe

---

## 🎯 DICAS IMPORTANTES PARA UM TESTE BEM-SUCEDIDO

### ✅ Preparação
- **Teste antes**: Verifique câmera/microfone em outro site
- **Ambiente calmo**: Escolha local silencioso e privado
- **Documentos**: Tenha RG, carteirinha do plano (se houver)
- **Lista de medicamentos**: Prepare lista do que toma

### ✅ Durante o teste
- **Feedback constante**: Relate problemas técnicos imediatamente  
- **Seja paciente**: Sistema em desenvolvimento, bugs podem ocorrer
- **Anote observações**: Sua experiência ajuda a melhorar o sistema
- **Teste diferentes cenários**: Cancele/remarque se possível

### ✅ Segurança
- **Dados reais**: Use informações verdadeiras, mas dados sensíveis ficam locais
- **Patient ID**: Guarde com segurança, mas não é confidencial crítico
- **Não compartilhe**: Não passe seu Patient ID para outros

---

## 📊 PASSO 9: Feedback e Avaliação

### 9.1 Avaliação da consulta
Após a consulta, você pode ser solicitado a avaliar:
- ⭐ **Qualidade do atendimento** (1-5 estrelas)
- ⭐ **Facilidade de uso da plataforma** (1-5 estrelas)  
- ⭐ **Qualidade técnica** (áudio/vídeo) (1-5 estrelas)
- 💬 **Comentários livres** sobre a experiência

### 9.2 Relatório de bugs
Se encontrar problemas, reporte:
- 🐛 **Descrição do erro** (o que aconteceu)
- 🕐 **Quando aconteceu** (horário aproximado)
- 🖥️ **Navegador usado** (Chrome, Firefox, etc.)
- 📱 **Dispositivo** (computador, celular, tablet)
- 📋 **Passos para reproduzir** o problema

---

## 🎉 Parabéns! Teste Concluído

Você completou seu teste na plataforma TeleMed! Sua participação é fundamental para:

- 🚀 **Melhorar a experiência** de futuros pacientes
- 🔧 **Identificar bugs** e pontos de melhoria  
- 📈 **Validar funcionalidades** antes do lançamento
- 🏥 **Revolucionar** o atendimento médico no Brasil

**Próximos passos:**
- Aguarde feedback da equipe sobre sua experiência
- Você pode ser convidado para novos testes
- Fique atento ao lançamento oficial da plataforma

---

## 📞 Contato e Suporte

**Equipe TeleMed**
- 📧 **Email geral**: contato@telemed.app  
- 🛟 **Suporte técnico**: suporte@telemed.app
- 📱 **WhatsApp**: Link fornecido pela equipe
- 🌐 **Website**: www.telemed.app

**Emergências médicas**: 
⚠️ Esta plataforma NÃO substitui emergências médicas. Em casos urgentes, procure o pronto-socorro mais próximo ou chame 192 (SAMU).

---

*Obrigado por fazer parte da revolução da telemedicina no Brasil! 🇧🇷*

**Versão do guia**: 1.0 - Set-Out 2025  
**Última atualização**: Setembro 2025
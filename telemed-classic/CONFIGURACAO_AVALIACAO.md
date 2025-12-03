# 📝 Configuração do Sistema de Avaliação TeleMed

## ✅ **IMPLEMENTADO**

1. **Página de Avaliação** → `/avaliacao.html`
2. **Página de Agradecimento** → `/obrigado.html`
3. **Integração com navegação** → Botões em consultas e página principal

## ⚙️ **CONFIGURAÇÃO NECESSÁRIA**

### 1) **Google Sheets**
Crie uma planilha com aba `Respostas` e estas colunas:

```
timestamp | role | appointmentId | facilidade_uso | clareza_fluxo | recurso_mais_util | outro_qual | dificuldades_texto | sugestoes_texto | nps | bugs_ou_erros | qual_bugs | device | navegador | app_version | user_agent | ip
```

### 2) **Google Apps Script**

1. **Google Drive** → **Novo** → **Apps Script**
2. Cole este código em `Code.gs`:

```javascript
const SPREADSHEET_ID = 'COLOQUE_AQUI_O_ID_DA_SUA_PLANILHA';
const SHEET_NAME = 'Respostas';

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const contentType = e.postData && e.postData.type ? e.postData.type : '';

    let payload = {};
    if (contentType.includes('application/json')) {
      payload = JSON.parse(e.postData.contents);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = e.parameter;
      Object.keys(params).forEach(k => { payload[k] = params[k]; });
    } else {
      try { payload = JSON.parse(e.postData.contents); } catch (_) {}
    }

    const safe = k => (k in payload ? String(payload[k]).trim() : '');

    const row = [
      new Date(),
      safe('role'),
      safe('appointmentId'),
      safe('facilidade_uso'),
      safe('clareza_fluxo'),
      safe('recurso_mais_util'),
      safe('outro_qual'),
      safe('dificuldades_texto'),
      safe('sugestoes_texto'),
      safe('nps'),
      safe('bugs_ou_erros'),
      safe('qual_bugs'),
      safe('device'),
      safe('navegador'),
      safe('app_version'),
      safe('user_agent'),
      safe('ip')
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. **Implantar** → **Implantar como aplicativo da web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa com o link**
   - **Copie a URL gerada**

### 3) **Configurar Variável de Ambiente**

Defina a variável de ambiente `EVALUATION_ENDPOINT`:

```bash
# Para desenvolvimento
export EVALUATION_ENDPOINT=https://script.google.com/macros/s/SEU_SCRIPT_ID/exec

# Para produção (no Render/Vercel)
EVALUATION_ENDPOINT=https://script.google.com/macros/s/SEU_SCRIPT_ID/exec
```

**⚠️ OBRIGATÓRIO**: Esta variável deve ser definida para o sistema funcionar. Sem ela, o endpoint retornará erro 503.

## 🔗 **Como Usar**

### URLs diretas:
- **Médico**: `/avaliacao.html?role=medico&appointmentId=APT-123`
- **Paciente**: `/avaliacao.html?role=paciente&appointmentId=APT-123`

### Botões já integrados:
- **Página de consulta**: Botão "📝 Avaliação" na barra superior
- **Após finalizar consulta**: Botão "📝 Avaliar Experiência"
- **Página principal**: Links diretos para teste

## 📊 **Análise de Dados**

### Fórmulas para Dashboard (Google Sheets):

```
Média de facilidade: =AVERAGE(FILTER(Respostas!D:D, Respostas!D:D<>""))
NPS Promotores: =COUNTIF(Respostas!J:J, ">=9")
NPS Detratores: =COUNTIF(Respostas!J:J, "<=6")
Total respostas: =COUNTA(Respostas!J:J)-1
NPS Score: =((Promotores/Total)-(Detratores/Total))*100
```

## 🛡️ **LGPD & Privacidade**

- ✅ **Não coleta dados clínicos**
- ✅ **IP opcional** (remova se não usar)
- ✅ **Dados anonimizados** via hash quando necessário
- ✅ **Consentimento implícito** no envio

## 🚀 **Recursos Implementados**

- **17 campos de dados** coletados
- **Sistema NPS** interativo (0-10)
- **Auto-detecção** de dispositivo/navegador
- **Pré-preenchimento** via URL
- **Design responsivo** TeleMed
- **Validação de campos** obrigatórios
- **Feedback visual** de envio
- **Redirecionamento** automático
- **Data-testids** para testes automatizados

---

**Próximos passos**: Configure Google Sheets + Apps Script e atualize a URL no frontend!
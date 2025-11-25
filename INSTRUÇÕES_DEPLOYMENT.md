# 🚀 Instruções para Ativar o Deployment TeleMed

## Passo 1: Abrir o arquivo `.replit`

No Replit, clique no arquivo `.replit` no painel de arquivos à esquerda.

---

## Passo 2: Localizar as linhas que precisa alterar

Procure pela seção `[deployment]` (você verá isso na linha 9)

---

## ❌ ANTES (Linhas atuais 11-12):

```
build = ["sh", "-c", "bash -lc ' set -e # instala deps no root..."]
run = ["sh", "-c", "bash -lc 'node production.js'"]
```

---

## ✅ DEPOIS (Substituir por):

### Linha 11 - Build command:
```
build = ["sh", "-c", "bash -lc 'set -e && npm install --omit=dev --legacy-peer-deps && npx esbuild server-prod.cjs --bundle --platform=node --format=cjs --outfile=production-full.cjs'"]
```

### Linha 12 - Run command:
```
run = ["sh", "-c", "bash -lc 'node start.cjs'"]
```

---

## 📋 Como fazer (copiar/colar):

1. Abra `.replit`
2. **Linha 11**: Selecione e delete a linha inteira começando com `build = [`
3. Copie e cole exatamente:
   ```
   build = ["sh", "-c", "bash -lc 'set -e && npm install --omit=dev --legacy-peer-deps && npx esbuild server-prod.cjs --bundle --platform=node --format=cjs --outfile=production-full.cjs'"]
   ```

4. **Linha 12**: Selecione e delete a linha inteira começando com `run = [`
5. Copie e cole exatamente:
   ```
   run = ["sh", "-c", "bash -lc 'node start.cjs'"]
   ```

6. **Salve** com Ctrl+S (ou Cmd+S no Mac)
7. **Clique Publish** para fazer o deploy

---

## 🎯 O que vai acontecer:

**Build Phase:**
- ✅ Instala dependências com `npm install --omit=dev`
- ✅ Gera `production-full.cjs` com esbuild (bundle autocontido)

**Run Phase:**
- ✅ Executa `node start.cjs`
- ✅ Que carrega `production-full.cjs` (Express embutido)
- ✅ Servidor abre na porta 5000

---

## ⚠️ Pontos importantes:

- ✅ Arquivo `start.cjs` já existe no root
- ✅ Arquivo `production-full.cjs` será gerado na build
- ✅ Não precisa de `npm run build` script
- ✅ Não precisa chamar `production.js`

---

## 🎉 Pronto!

Depois de alterar o `.replit` e clicar Publish, seu TeleMed estará ao vivo em poucos minutos!

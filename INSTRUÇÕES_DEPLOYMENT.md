# 🚀 Instruções para Ativar o Deployment TeleMed

## Passo 1: Abrir o arquivo `.replit`

No Replit, clique no arquivo `.replit` no painel de arquivos à esquerda.

---

## Passo 2: Localizar as linhas que precisa alterar

Procure pela seção `[deployment]` (você verá isso na linha 9)

---

## ❌ ANTES (Linhas atuais 11-12):

```
build = ["sh", "-c", "bash -lc ' set -e # instala deps no root (com fallback se não houver lockfile) if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then   npm ci --include=dev else   npm install --include=dev fi  # build do TeleMedMerge (root) npm run build || (vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist) '"]
run = ["sh", "-c", "bash -lc 'node production.js'"]
```

---

## ✅ DEPOIS (Substituir por):

### Linha 11 - Build command (SUBSTITUIR COMPLETAMENTE):
```
build = ["sh", "-c", "bash -lc 'set -e && npm install --omit=dev --legacy-peer-deps && npm run build && npx esbuild server-prod.cjs --bundle --platform=node --format=cjs --outfile=production-full.cjs'"]
```

### Linha 12 - Run command (SUBSTITUIR COMPLETAMENTE):
```
run = ["sh", "-c", "bash -lc 'node production.cjs'"]
```

---

## 📝 Resumo das mudanças:

| Linha | Campo | Antes | Depois |
|-------|-------|-------|--------|
| 11 | `build` | Longa string complexa | `npm install --omit=dev && npm run build && npx esbuild server-prod.cjs --bundle --platform=node --format=cjs --outfile=production-full.cjs` |
| 12 | `run` | `node production.js` | `node production.cjs` |

---

## Como fazer:

1. **Clique** no arquivo `.replit` para abri-lo
2. **Localize** a linha 11 (você verá `build = [`)
3. **Selecione** toda a linha 11 e **delete**
4. **Paste** a nova linha 11 acima
5. **Localize** a linha 12 (você verá `run = [`)
6. **Selecione** toda a linha 12 e **delete**
7. **Paste** a nova linha 12

---

## 🎯 O que vai acontecer:

Na **Build Phase** (deploy):
- ✅ Instala dependências de produção
- ✅ Roda o build do frontend
- ✅ Gera `production-full.cjs` (um bundle autocontido com Express embutido)

Na **Run Phase** (execução):
- ✅ Executa `node production.cjs`
- ✅ Carrega o bundle autocontido
- ✅ Servidor abre na porta 5000 ✅

---

## ⚡ Depois de alterar:

1. **Salve** o `.replit` (Ctrl+S ou Cmd+S)
2. **Clique** em "Publish" para fazer o deploy
3. **Aguarde** 2-3 minutos
4. Seu TeleMed estará **ao vivo**! 🎉

---

## ❓ Dúvidas?

Se receber erro "Cannot find module", é sinal que o `.replit` não foi salvo corretamente.
Verifique se as duas linhas estão exatamente como mostrado acima.

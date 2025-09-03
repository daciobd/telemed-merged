# TeleMed — Demo Frontend Pack

Arquivos a copiar para o seu repositório (monorepo):

apps/telemed-deploy-ready/
  demo.html
  css/style.css
  js/config.js
  js/demo.js
  img/logo.svg

Como publicar no Render (Static Site)
- Root Directory: apps/telemed-deploy-ready
- Build Command: :
- Publish Directory: .
- Manual Deploy → Clear cache & deploy

Configuração
Edite js/config.js com os subdomínios atuais dos serviços:
- AUCTION_URL
- PRODUCTIVITY_URL

Abra https://<seu-domínio>/demo.html para conduzir a demonstração.

const express = require('express');
const path = require('path');
const app = express();

const service = process.env.SERVICE_NAME || 'telemed-auction';
const version = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';

app.get('/healthz', (_, res) => res.status(200).json({ ok: true }));
app.get('/', (_, res) => res.json({ service, status: 'running', version, endpoints: ['/', '/healthz'] }));

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('listening on', port));
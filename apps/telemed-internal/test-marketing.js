const express = require('express');
const app = express();
const port = 3001;

// Simula as rotas
const router = require('express').Router();

router.get('/cac-real/details', (req, res) => {
  res.json({
    success: true,
    message: 'Marketing API working!',
    params: req.query,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/internal/marketing', router);

app.listen(port, () => {
  console.log(`Test server on http://localhost:${port}`);
  console.log(`Test: curl http://localhost:${port}/api/internal/marketing/cac-real/details?from=2024-01-01`);
});

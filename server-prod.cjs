const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const PORT = parseInt(process.env.PORT || '5000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'telemed-prod-secret-2024';
const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health endpoints
app.get(['/api/health', '/healthz', '/health'], (req, res) => {
  res.json({ 
    ok: true, 
    service: 'telemed-production',
    timestamp: new Date().toISOString()
  });
});

// Config.js
app.get('/config.js', (req, res) => {
  res.type('application/javascript').send('window.TELEMED_CFG = { FEATURE_PRICING: true, AUCTION_URL: "/api/auction" };');
});

// ============================================
// CONSULTÓRIO VIRTUAL API (Demo Mode)
// ============================================

// Demo user database
const demoUsers = {
  'medico@demo.com': {
    id: 1,
    email: 'medico@demo.com',
    passwordHash: '$2b$10$CtvH.ra.m4qNxLfznvAp.O54mau1smoHtd/z//YqGoJYpikPNuuZS', // Senha123!
    role: 'doctor',
    fullName: 'Dr. Demo Silva'
  },
  'paciente@demo.com': {
    id: 2,
    email: 'paciente@demo.com',
    passwordHash: '$2b$10$CtvH.ra.m4qNxLfznvAp.O54mau1smoHtd/z//YqGoJYpikPNuuZS', // Senha123!
    role: 'patient',
    fullName: 'Paciente Demo'
  }
};

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Login
app.post('/api/consultorio/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = demoUsers[email];
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Auth me
app.get('/api/consultorio/auth/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName
    }
  });
});

// Dashboard stats
app.get('/api/consultorio/dashboard/stats', authenticate, (req, res) => {
  res.json({
    consultasHoje: 2,
    consultasSemana: 8,
    novasMarketplace: 5,
    ganhosEsteMes: 2340.00
  });
});

// Próximas consultas
app.get('/api/consultorio/dashboard/proximas', authenticate, (req, res) => {
  const hoje = new Date();
  hoje.setHours(hoje.getHours() + 2);
  
  res.json([
    { id: 'p1', paciente: 'Maria Silva', dataHora: hoje.toISOString(), especialidade: 'Psiquiatria Adulto' },
    { id: 'p2', paciente: 'João Santos', dataHora: new Date(hoje.getTime() + 2*60*60*1000).toISOString(), especialidade: 'Clínica Geral' }
  ]);
});

// Marketplace
app.get('/api/consultorio/marketplace', authenticate, (req, res) => {
  res.json([
    { id: 'c1', especialidade: 'Psiquiatria Adulto', inicio: new Date(Date.now() + 7*24*60*60*1000).toISOString(), duracaoMinutos: 50, valorBase: 180.0, cidade: 'São Paulo - SP', origem: 'Marketplace TeleMed', status: 'disponivel' },
    { id: 'c2', especialidade: 'Clínica Geral', inicio: new Date(Date.now() + 3*24*60*60*1000).toISOString(), duracaoMinutos: 30, valorBase: 120.0, cidade: 'Rio de Janeiro - RJ', origem: 'Marketplace TeleMed', status: 'disponivel' },
    { id: 'c3', especialidade: 'Dermatologia', inicio: new Date(Date.now() + 5*24*60*60*1000).toISOString(), duracaoMinutos: 30, valorBase: 150.0, cidade: 'Belo Horizonte - MG', origem: 'Marketplace TeleMed', status: 'disponivel' }
  ]);
});

// Minhas consultas
app.get('/api/consultorio/minhas-consultas', authenticate, (req, res) => {
  res.json([
    { id: 'mc1', paciente: 'Maria Silva', especialidade: 'Psiquiatria Adulto', dataHora: new Date(Date.now() + 2*24*60*60*1000).toISOString(), duracao: 50, status: 'agendada', valorAcordado: 180.0 },
    { id: 'mc2', paciente: 'João Santos', especialidade: 'Clínica Geral', dataHora: new Date(Date.now() + 1*24*60*60*1000).toISOString(), duracao: 30, status: 'agendada', valorAcordado: 120.0 },
    { id: 'mc3', paciente: 'Ana Oliveira', especialidade: 'Psiquiatria Adulto', dataHora: new Date(Date.now() - 3*24*60*60*1000).toISOString(), duracao: 50, status: 'concluida', valorAcordado: 180.0 }
  ]);
});

// Detalhes consulta
app.get('/api/consultorio/consultas/:id', authenticate, (req, res) => {
  res.json({
    id: req.params.id,
    especialidade: 'Psiquiatria Adulto',
    dataHora: new Date(Date.now() + 2*24*60*60*1000).toISOString(),
    duracao: 50,
    status: 'agendada',
    valorAcordado: 180.0,
    paciente: { nome: 'Maria Silva', idade: 35, sexo: 'Feminino', email: 'maria.silva@email.com', telefone: '(11) 99999-8888' },
    queixaPrincipal: 'Paciente relata sintomas de ansiedade.'
  });
});

// Lances
app.post('/api/consultorio/lances', authenticate, (req, res) => {
  const { consultationId, bidAmount } = req.body;
  res.json({ success: true, lance: { id: `lance_${Date.now()}`, consultationId, bidAmount, status: 'pending' } });
});

// Doctor dashboard
app.get('/api/consultorio/doctor/dashboard', authenticate, (req, res) => {
  res.json({
    doctor: { id: 1, fullName: req.user.fullName, accountType: 'hybrid' },
    stats: { consultasHoje: 2, consultasSemana: 8, novasMarketplace: 5, ganhosEsteMes: 2340.00 }
  });
});

// Agenda endpoint
app.get('/api/consultorio/agenda', authenticate, (req, res) => {
  res.json([
    { id: 'a1', paciente: 'Maria Silva', dataHora: new Date(Date.now() + 1*24*60*60*1000).toISOString(), duracao: 50, status: 'confirmada' },
    { id: 'a2', paciente: 'João Santos', dataHora: new Date(Date.now() + 2*24*60*60*1000).toISOString(), duracao: 30, status: 'confirmada' }
  ]);
});

// ============================================
// STATIC FILES
// ============================================

// Assets
app.use('/assets', express.static(path.join(process.cwd(), 'attached_assets')));

// Consultório Virtual (React SPA)
const consultorioDist = path.join(process.cwd(), 'client', 'dist');
app.use('/consultorio', express.static(consultorioDist));

// SPA fallback for Consultório
app.use('/consultorio', (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (/\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt|pdf)$/i.test(req.path)) return next();
  res.sendFile(path.join(consultorioDist, 'index.html'));
});

// TeleMed Classic
const telemedClassic = path.join(process.cwd(), 'telemed-classic');
app.use('/', express.static(telemedClassic));

// Fallback for classic TeleMed
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/') || req.path.startsWith('/consultorio')) return next();
  if (/\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt|pdf)$/i.test(req.path)) return next();
  res.sendFile(path.join(telemedClassic, 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🩺 TeleMed Production running on port ${PORT}`);
  console.log(`   /consultorio → React SPA (Consultório Virtual)`);
  console.log(`   / → TeleMed Classic`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});

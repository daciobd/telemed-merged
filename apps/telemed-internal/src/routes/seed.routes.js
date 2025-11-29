import express from 'express';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Rota de seed - População inicial do banco de dados
router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Iniciando seed via POST /api/seed...');
    
    // Importar dinâmicamente para evitar problemas de ESM
    const { db } = await import('../../../../../db/index.ts');
    const { users, doctors, virtualOfficeSettings } = await import('../../../../../db/schema.ts');
    
    // Verificar se já tem dados
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '⚠️ Banco já contém dados! Seed não executado.'
      });
    }

    // DRA. ANA SILVA - CARDIOLOGIA
    const draSilvaPass = await bcrypt.hash('senha123', 10);
    const [draSilvaUser] = await db.insert(users).values({
      email: 'dra.anasilva@teste.com',
      passwordHash: draSilvaPass,
      role: 'doctor',
      fullName: 'Dra. Ana Silva',
      phone: '11987654326',
      cpf: '111.222.333-44',
    }).returning();

    const [draSilva] = await db.insert(doctors).values({
      userId: draSilvaUser.id,
      crm: '123456',
      crmState: 'SP',
      specialties: ['Cardiologia'],
      accountType: 'virtual_office',
      customUrl: 'dra-anasilva',
      consultationPricing: { primeira_consulta: 300, retorno: 200, urgente: 450, check_up: 250 },
      bio: 'Cardiologista com 15 anos de experiência.',
      consultationDuration: 45,
      availability: { monday: ['08:00-12:00', '14:00-18:00'], tuesday: ['08:00-12:00', '14:00-18:00'], wednesday: ['08:00-12:00'], thursday: ['08:00-12:00', '14:00-18:00'], friday: ['08:00-12:00', '14:00-18:00'] },
      rating: '4.9',
      totalConsultations: 234,
      isVerified: true,
      isActive: true,
    }).returning();

    await db.insert(virtualOfficeSettings).values({
      doctorId: draSilva.id,
      autoAcceptBookings: false,
      requirePrepayment: true,
      allowCancellation: true,
      cancellationHours: 48,
      customBranding: { primaryColor: '#ef4444' },
      welcomeMessage: 'Bem-vindo ao consultório da Dra. Ana Silva! Cuidando do seu coração com excelência.',
      bookingInstructions: 'Agende sua consulta cardiológica.',
      emailNotifications: true,
      whatsappNotifications: true,
    });

    // DR. JOÃO SANTOS - CLÍNICA GERAL
    const drSantosPass = await bcrypt.hash('senha123', 10);
    const [drSantosUser] = await db.insert(users).values({
      email: 'dr.joaosantos@teste.com',
      passwordHash: drSantosPass,
      role: 'doctor',
      fullName: 'Dr. João Santos',
      phone: '21987654327',
      cpf: '222.333.444-55',
    }).returning();

    const [drSantos] = await db.insert(doctors).values({
      userId: drSantosUser.id,
      crm: '789012',
      crmState: 'RJ',
      specialties: ['Clínica Geral', 'Medicina Preventiva'],
      accountType: 'hybrid',
      customUrl: 'dr-joaosantos',
      consultationPricing: { primeira_consulta: 180, retorno: 120, urgente: 250, check_up: 150 },
      bio: 'Médico de família dedicado à medicina preventiva.',
      consultationDuration: 30,
      availability: { monday: ['09:00-18:00'], tuesday: ['09:00-18:00'], wednesday: ['09:00-18:00'], thursday: ['09:00-18:00'], friday: ['09:00-18:00'], saturday: ['09:00-13:00'] },
      rating: '5.0',
      totalConsultations: 156,
      isVerified: true,
      isActive: true,
    }).returning();

    await db.insert(virtualOfficeSettings).values({
      doctorId: drSantos.id,
      autoAcceptBookings: true,
      requirePrepayment: false,
      allowCancellation: true,
      cancellationHours: 24,
      customBranding: { primaryColor: '#3b82f6' },
      welcomeMessage: 'Seja bem-vindo! Estou aqui para cuidar da sua saúde.',
      bookingInstructions: 'Escolha o melhor horário. Atendo de segunda a sábado!',
      emailNotifications: true,
      whatsappNotifications: true,
    });

    console.log('✅ Seed concluído com sucesso!');
    res.json({
      success: true,
      message: '✅ Seed concluído! 2 médicos criados.',
      credentials: {
        doctors: ['dra.anasilva@teste.com', 'dr.joaosantos@teste.com'],
        password: 'senha123',
        urls: ['/dr/dra-anasilva', '/dr/dr-joaosantos']
      }
    });

  } catch (error) {
    console.error('❌ Erro no seed:', error.message);
    res.status(500).json({ 
      success: false, 
      message: '❌ Erro: ' + error.message 
    });
  }
});

export default router;

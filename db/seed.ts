import { db } from './index';
import { users, patients, doctors, virtualOfficeSettings } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    const password = await bcrypt.hash('senha123', 10);

    // ============================================
    // PACIENTE: João da Silva
    // ============================================
    const existingPatient = await db.select().from(users).where(eq(users.email, 'paciente@teste.com'));
    if (existingPatient.length === 0) {
      const [patientUser] = await db.insert(users).values({
        email: 'paciente@teste.com',
        passwordHash: password,
        role: 'patient',
        fullName: 'João da Silva',
        phone: '11987654321',
        cpf: '123.456.789-00',
      }).returning();

      await db.insert(patients).values({
        userId: patientUser.id,
        dateOfBirth: new Date('1990-05-15'),
        gender: 'masculino',
        address: { street: 'Rua Exemplo, 123', city: 'São Paulo', state: 'SP', zipCode: '01234-567' },
        medicalHistory: { allergies: ['Penicilina'], chronicConditions: [], medications: [] },
        emergencyContact: { name: 'Maria da Silva', phone: '11987654322', relationship: 'Esposa' }
      });
      console.log('✅ Paciente criado: paciente@teste.com');
    } else {
      console.log('⏭️ Paciente já existe: paciente@teste.com');
    }

    // ============================================
    // MÉDICO 1: Dra. Ana Paula Santos (Marketplace)
    // ============================================
    const existingM1 = await db.select().from(users).where(eq(users.email, 'medico.marketplace@teste.com'));
    if (existingM1.length === 0) {
      const [user1] = await db.insert(users).values({
        email: 'medico.marketplace@teste.com',
        passwordHash: password,
        role: 'doctor',
        fullName: 'Dra. Ana Paula Santos',
        phone: '11987654323',
        cpf: '987.654.321-00',
      }).returning();

      await db.insert(doctors).values({
        userId: user1.id,
        crm: 'CRM123456',
        crmState: 'SP',
        specialties: ['Clínica Geral', 'Cardiologia'],
        accountType: 'marketplace',
        monthlyPlan: 'none',
        isAvailableMarketplace: true,
        minPriceMarketplace: '80.00',
        bio: 'Médica com 10 anos de experiência em clínica geral e cardiologia.',
        education: [{ degree: 'Medicina', institution: 'USP', year: 2013 }],
        consultationDuration: 30,
        availability: {
          monday: ['09:00-12:00', '14:00-18:00'],
          tuesday: ['09:00-12:00', '14:00-18:00'],
          wednesday: ['09:00-12:00'],
          thursday: ['09:00-12:00', '14:00-18:00'],
          friday: ['09:00-12:00', '14:00-18:00']
        },
        isVerified: true,
        isActive: true,
      });
      console.log('✅ Médico Marketplace: medico.marketplace@teste.com');
    }

    // ============================================
    // MÉDICO 2: Dr. Carlos Pereira (Psiquiatria - Virtual Office)
    // ============================================
    const existingM2 = await db.select().from(users).where(eq(users.email, 'dr.carlospereira@teste.com'));
    if (existingM2.length === 0) {
      const [user2] = await db.insert(users).values({
        email: 'dr.carlospereira@teste.com',
        passwordHash: password,
        role: 'doctor',
        fullName: 'Dr. Carlos Pereira',
        phone: '11987654324',
        cpf: '456.789.123-00',
      }).returning();

      const [doc2] = await db.insert(doctors).values({
        userId: user2.id,
        crm: 'CRM654321',
        crmState: 'SP',
        specialties: ['Psiquiatria'],
        accountType: 'virtual_office',
        monthlyPlan: 'professional',
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customUrl: 'dr-carlospereira',
        consultationPricing: { primeira_consulta: 250, retorno: 180, urgente: 350, check_up: 200 },
        isAvailableMarketplace: false,
        bio: 'Psiquiatra especializado em transtornos de ansiedade e depressão.',
        education: [
          { degree: 'Medicina', institution: 'UNIFESP', year: 2010 },
          { degree: 'Residência em Psiquiatria', institution: 'HC-FMUSP', year: 2014 }
        ],
        consultationDuration: 50,
        availability: {
          monday: ['08:00-12:00', '14:00-18:00'],
          tuesday: ['08:00-12:00', '14:00-18:00'],
          wednesday: ['08:00-12:00', '14:00-18:00'],
          thursday: ['08:00-12:00', '14:00-18:00'],
          friday: ['08:00-12:00']
        },
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(virtualOfficeSettings).values({
        doctorId: doc2.id,
        autoAcceptBookings: false,
        requirePrepayment: true,
        allowCancellation: true,
        cancellationHours: 48,
        customBranding: { primaryColor: '#2563eb', logo: null, bannerImage: null },
        welcomeMessage: 'Bem-vindo ao consultório virtual do Dr. Carlos Pereira!',
        bookingInstructions: 'Por favor, selecione um horário disponível e preencha o formulário.',
        emailNotifications: true,
        whatsappNotifications: true,
        smsNotifications: false,
      });
      console.log('✅ Médico Virtual Office: dr.carlospereira@teste.com → /dr/dr-carlospereira');
    }

    // ============================================
    // MÉDICO 3: Dra. Fernanda Costa (Híbrido - Pediatria)
    // ============================================
    const existingM3 = await db.select().from(users).where(eq(users.email, 'dra.fernanda@teste.com'));
    if (existingM3.length === 0) {
      const [user3] = await db.insert(users).values({
        email: 'dra.fernanda@teste.com',
        passwordHash: password,
        role: 'doctor',
        fullName: 'Dra. Fernanda Costa',
        phone: '11987654325',
        cpf: '321.654.987-00',
      }).returning();

      const [doc3] = await db.insert(doctors).values({
        userId: user3.id,
        crm: 'CRM789456',
        crmState: 'SP',
        specialties: ['Pediatria'],
        accountType: 'hybrid',
        monthlyPlan: 'basic',
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customUrl: 'dra-fernanda',
        consultationPricing: { primeira_consulta: 180, retorno: 120, urgente: 250, check_up: 150 },
        isAvailableMarketplace: true,
        minPriceMarketplace: '100.00',
        bio: 'Pediatra com foco em desenvolvimento infantil e vacinação.',
        education: [{ degree: 'Medicina', institution: 'UNICAMP', year: 2015 }],
        consultationDuration: 40,
        availability: {
          monday: ['09:00-12:00', '14:00-17:00'],
          tuesday: ['09:00-12:00', '14:00-17:00'],
          wednesday: ['09:00-12:00'],
          thursday: ['09:00-12:00', '14:00-17:00'],
          friday: ['09:00-12:00', '14:00-17:00']
        },
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(virtualOfficeSettings).values({
        doctorId: doc3.id,
        autoAcceptBookings: true,
        requirePrepayment: true,
        allowCancellation: true,
        cancellationHours: 24,
        customBranding: { primaryColor: '#10b981', logo: null, bannerImage: null },
        welcomeMessage: 'Pediatria com carinho! Agende sua consulta.',
        emailNotifications: true,
        whatsappNotifications: false,
      });
      console.log('✅ Médico Híbrido: dra.fernanda@teste.com → /dr/dra-fernanda');
    }

    // ============================================
    // MÉDICO 4: Dra. Ana Silva (Cardiologia - Virtual Office) 🌟
    // ============================================
    const existingM4 = await db.select().from(users).where(eq(users.email, 'dra.anasilva@teste.com'));
    if (existingM4.length === 0) {
      const [user4] = await db.insert(users).values({
        email: 'dra.anasilva@teste.com',
        passwordHash: password,
        role: 'doctor',
        fullName: 'Dra. Ana Silva',
        phone: '11987654326',
        cpf: '111.222.333-44',
      }).returning();

      const [doc4] = await db.insert(doctors).values({
        userId: user4.id,
        crm: 'CRM111111',
        crmState: 'SP',
        specialties: ['Cardiologia'],
        accountType: 'virtual_office',
        monthlyPlan: 'professional',
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customUrl: 'dra-anasilva',
        consultationPricing: { primeira_consulta: 300, retorno: 200, urgente: 450, check_up: 250 },
        bio: 'Cardiologista com 15 anos de experiência em prevenção cardiovascular e tratamento de hipertensão. Formada pela USP, com residência no InCor.',
        education: [
          { degree: 'Medicina', institution: 'USP', year: 2008 },
          { degree: 'Residência em Cardiologia', institution: 'InCor', year: 2011 }
        ],
        consultationDuration: 45,
        availability: {
          monday: ['08:00-12:00', '14:00-18:00'],
          tuesday: ['08:00-12:00', '14:00-18:00'],
          wednesday: ['08:00-12:00'],
          thursday: ['08:00-12:00', '14:00-18:00'],
          friday: ['08:00-12:00', '14:00-18:00']
        },
        rating: '4.9',
        totalConsultations: 234,
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(virtualOfficeSettings).values({
        doctorId: doc4.id,
        autoAcceptBookings: false,
        requirePrepayment: true,
        allowCancellation: true,
        cancellationHours: 48,
        customBranding: { primaryColor: '#ef4444', logo: null, bannerImage: null },
        welcomeMessage: 'Bem-vindo ao consultório da Dra. Ana Silva! Cuidando do seu coração com excelência.',
        bookingInstructions: 'Agende sua consulta cardiológica. Traga exames recentes se possuir.',
        emailNotifications: true,
        whatsappNotifications: true,
      });
      console.log('✅ Dra. Ana Silva: dra.anasilva@teste.com → /dr/dra-anasilva 🌟');
    }

    // ============================================
    // MÉDICO 5: Dr. João Santos (Clínica Geral - Híbrido) 🌟
    // ============================================
    const existingM5 = await db.select().from(users).where(eq(users.email, 'dr.joaosantos@teste.com'));
    if (existingM5.length === 0) {
      const [user5] = await db.insert(users).values({
        email: 'dr.joaosantos@teste.com',
        passwordHash: password,
        role: 'doctor',
        fullName: 'Dr. João Santos',
        phone: '21987654327',
        cpf: '222.333.444-55',
      }).returning();

      const [doc5] = await db.insert(doctors).values({
        userId: user5.id,
        crm: 'CRM789012',
        crmState: 'RJ',
        specialties: ['Clínica Geral', 'Medicina Preventiva'],
        accountType: 'hybrid',
        monthlyPlan: 'professional',
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customUrl: 'dr-joaosantos',
        consultationPricing: { primeira_consulta: 180, retorno: 120, urgente: 250, check_up: 150 },
        isAvailableMarketplace: true,
        minPriceMarketplace: '100.00',
        bio: 'Médico de família dedicado à medicina preventiva e cuidados primários. Atendimento humanizado e integral.',
        education: [
          { degree: 'Medicina', institution: 'UFRJ', year: 2012 },
          { degree: 'Medicina de Família', institution: 'UERJ', year: 2015 }
        ],
        consultationDuration: 30,
        availability: {
          monday: ['09:00-18:00'],
          tuesday: ['09:00-18:00'],
          wednesday: ['09:00-18:00'],
          thursday: ['09:00-18:00'],
          friday: ['09:00-18:00'],
          saturday: ['09:00-13:00']
        },
        rating: '5.0',
        totalConsultations: 156,
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(virtualOfficeSettings).values({
        doctorId: doc5.id,
        autoAcceptBookings: true,
        requirePrepayment: false,
        allowCancellation: true,
        cancellationHours: 24,
        customBranding: { primaryColor: '#3b82f6', logo: null, bannerImage: null },
        welcomeMessage: 'Seja bem-vindo! Estou aqui para cuidar da sua saúde com dedicação e atenção.',
        bookingInstructions: 'Escolha o melhor horário para você. Atendo de segunda a sábado!',
        emailNotifications: true,
        whatsappNotifications: true,
      });
      console.log('✅ Dr. João Santos: dr.joaosantos@teste.com → /dr/dr-joaosantos 🌟');
    }

    // ============================================
    // MÉDICO 6: Dr. Carlos Mendes (Ortopedia - Virtual Office) 🌟
    // ============================================
    const existingM6 = await db.select().from(users).where(eq(users.email, 'dr.carlosmendes@teste.com'));
    if (existingM6.length === 0) {
      const [user6] = await db.insert(users).values({
        email: 'dr.carlosmendes@teste.com',
        passwordHash: password,
        role: 'doctor',
        fullName: 'Dr. Carlos Mendes',
        phone: '31987654328',
        cpf: '333.444.555-66',
      }).returning();

      const [doc6] = await db.insert(doctors).values({
        userId: user6.id,
        crm: 'CRM345678',
        crmState: 'MG',
        specialties: ['Ortopedia'],
        accountType: 'virtual_office',
        monthlyPlan: 'professional',
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customUrl: 'dr-carlosmendes',
        consultationPricing: { primeira_consulta: 280, retorno: 180, urgente: 400, check_up: 220 },
        bio: 'Ortopedista especializado em medicina esportiva e tratamento de lesões. Tratamento conservador e cirúrgico.',
        education: [
          { degree: 'Medicina', institution: 'UFMG', year: 2010 },
          { degree: 'Residência em Ortopedia', institution: 'HC-UFMG', year: 2014 },
          { degree: 'Fellowship Medicina Esportiva', institution: 'IOT-USP', year: 2015 }
        ],
        consultationDuration: 40,
        availability: {
          monday: ['08:00-12:00', '14:00-18:00'],
          tuesday: ['08:00-12:00', '14:00-18:00'],
          wednesday: ['08:00-12:00'],
          thursday: ['08:00-12:00', '14:00-18:00'],
          friday: ['08:00-12:00']
        },
        rating: '4.8',
        totalConsultations: 89,
        isVerified: true,
        isActive: true,
      }).returning();

      await db.insert(virtualOfficeSettings).values({
        doctorId: doc6.id,
        autoAcceptBookings: false,
        requirePrepayment: true,
        allowCancellation: true,
        cancellationHours: 48,
        customBranding: { primaryColor: '#8b5cf6', logo: null, bannerImage: null },
        welcomeMessage: 'Especialista em ortopedia e medicina esportiva. Vamos cuidar da sua saúde musculoesquelética!',
        bookingInstructions: 'Traga exames de imagem (RX, ressonância) caso possua. Atendimento especializado.',
        emailNotifications: true,
        whatsappNotifications: true,
      });
      console.log('✅ Dr. Carlos Mendes: dr.carlosmendes@teste.com → /dr/dr-carlosmendes 🌟');
    }

    console.log('\n🎉 SEED CONCLUÍDO COM SUCESSO!');
    console.log('\n📋 RESUMO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Paciente: paciente@teste.com (senha123)');
    console.log('');
    console.log('👨‍⚕️ Médicos com Consultório Virtual:');
    console.log('   • /dr/dra-anasilva (Cardiologia) ⭐ 4.9');
    console.log('   • /dr/dr-joaosantos (Clínica Geral) ⭐ 5.0');
    console.log('   • /dr/dr-carlosmendes (Ortopedia) ⭐ 4.8');
    console.log('   • /dr/dr-carlospereira (Psiquiatria)');
    console.log('   • /dr/dra-fernanda (Pediatria)');
    console.log('');
    console.log('🏪 Marketplace: medico.marketplace@teste.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Erro no seed:', error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

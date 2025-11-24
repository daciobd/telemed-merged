import { db } from './index';
import { users, patients, doctors, virtualOfficeSettings } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // ============================================
    // CRIAR USUÁRIO PACIENTE DE EXEMPLO
    // ============================================
    const patientPassword = await bcrypt.hash('senha123', 10);
    
    const [patientUser] = await db.insert(users).values({
      email: 'paciente@teste.com',
      passwordHash: patientPassword,
      role: 'patient',
      fullName: 'João da Silva',
      phone: '11987654321',
      cpf: '123.456.789-00',
    }).returning();

    await db.insert(patients).values({
      userId: patientUser.id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'masculino',
      address: {
        street: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      medicalHistory: {
        allergies: ['Penicilina'],
        chronicConditions: [],
        medications: []
      },
      emergencyContact: {
        name: 'Maria da Silva',
        phone: '11987654322',
        relationship: 'Esposa'
      }
    });

    console.log('✅ Paciente criado:', patientUser.email);

    // ============================================
    // CRIAR MÉDICO MARKETPLACE
    // ============================================
    const doctorMarketplacePassword = await bcrypt.hash('senha123', 10);
    
    const [doctorMarketplaceUser] = await db.insert(users).values({
      email: 'medico.marketplace@teste.com',
      passwordHash: doctorMarketplacePassword,
      role: 'doctor',
      fullName: 'Dra. Ana Paula Santos',
      phone: '11987654323',
      cpf: '987.654.321-00',
    }).returning();

    await db.insert(doctors).values({
      userId: doctorMarketplaceUser.id,
      crm: '123456',
      crmState: 'SP',
      specialties: ['Clínica Geral', 'Cardiologia'],
      accountType: 'marketplace',
      monthlyPlan: 'none',
      isAvailableMarketplace: true,
      minPriceMarketplace: '80.00',
      bio: 'Médica com 10 anos de experiência em clínica geral e cardiologia.',
      education: [
        {
          degree: 'Medicina',
          institution: 'USP',
          year: 2013
        }
      ],
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

    console.log('✅ Médico Marketplace criado:', doctorMarketplaceUser.email);

    // ============================================
    // CRIAR MÉDICO CONSULTÓRIO VIRTUAL
    // ============================================
    const doctorOfficePassword = await bcrypt.hash('senha123', 10);
    
    const [doctorOfficeUser] = await db.insert(users).values({
      email: 'dr.carlospereira@teste.com',
      passwordHash: doctorOfficePassword,
      role: 'doctor',
      fullName: 'Dr. Carlos Pereira',
      phone: '11987654324',
      cpf: '456.789.123-00',
    }).returning();

    const [doctorOffice] = await db.insert(doctors).values({
      userId: doctorOfficeUser.id,
      crm: '654321',
      crmState: 'SP',
      specialties: ['Psiquiatria'],
      accountType: 'virtual_office',
      monthlyPlan: 'professional',
      planStartDate: new Date(),
      planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
      customUrl: 'dr-carlospereira',
      consultationPricing: {
        primeira_consulta: 250,
        retorno: 180,
        urgente: 350,
        check_up: 200
      },
      isAvailableMarketplace: false,
      bio: 'Psiquiatra especializado em transtornos de ansiedade e depressão.',
      education: [
        {
          degree: 'Medicina',
          institution: 'UNIFESP',
          year: 2010
        },
        {
          degree: 'Residência em Psiquiatria',
          institution: 'HC-FMUSP',
          year: 2014
        }
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
      doctorId: doctorOffice.id,
      autoAcceptBookings: false,
      requirePrepayment: true,
      allowCancellation: true,
      cancellationHours: 48,
      customBranding: {
        primaryColor: '#2563eb',
        logo: null,
        bannerImage: null
      },
      welcomeMessage: 'Bem-vindo ao consultório virtual do Dr. Carlos Pereira!',
      bookingInstructions: 'Por favor, selecione um horário disponível e preencha o formulário.',
      emailNotifications: true,
      whatsappNotifications: true,
      smsNotifications: false,
    });

    console.log('✅ Médico Consultório Virtual criado:', doctorOfficeUser.email);
    console.log(`   URL: telemed.com.br/dr/${doctorOffice.customUrl}`);

    // ============================================
    // CRIAR MÉDICO HÍBRIDO (AMBOS)
    // ============================================
    const doctorHybridPassword = await bcrypt.hash('senha123', 10);
    
    const [doctorHybridUser] = await db.insert(users).values({
      email: 'dra.fernanda@teste.com',
      passwordHash: doctorHybridPassword,
      role: 'doctor',
      fullName: 'Dra. Fernanda Costa',
      phone: '11987654325',
      cpf: '321.654.987-00',
    }).returning();

    const [doctorHybrid] = await db.insert(doctors).values({
      userId: doctorHybridUser.id,
      crm: '789456',
      crmState: 'SP',
      specialties: ['Pediatria'],
      accountType: 'hybrid',
      monthlyPlan: 'basic',
      planStartDate: new Date(),
      planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customUrl: 'dra-fernanda',
      consultationPricing: {
        primeira_consulta: 180,
        retorno: 120,
        urgente: 250,
        check_up: 150
      },
      isAvailableMarketplace: true,
      minPriceMarketplace: '100.00',
      bio: 'Pediatra com foco em desenvolvimento infantil e vacinação.',
      education: [
        {
          degree: 'Medicina',
          institution: 'UNICAMP',
          year: 2015
        }
      ],
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
      doctorId: doctorHybrid.id,
      autoAcceptBookings: true,
      requirePrepayment: true,
      allowCancellation: true,
      cancellationHours: 24,
      customBranding: {
        primaryColor: '#10b981',
        logo: null,
        bannerImage: null
      },
      welcomeMessage: 'Pediatria com carinho! Agende sua consulta.',
      emailNotifications: true,
      whatsappNotifications: false,
    });

    console.log('✅ Médico Híbrido criado:', doctorHybridUser.email);
    console.log(`   URL: telemed.com.br/dr/${doctorHybrid.customUrl}`);

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📋 CREDENCIAIS DE TESTE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Paciente:');
    console.log('  Email: paciente@teste.com');
    console.log('  Senha: senha123');
    console.log('\nMédico Marketplace:');
    console.log('  Email: medico.marketplace@teste.com');
    console.log('  Senha: senha123');
    console.log('\nMédico Consultório Virtual:');
    console.log('  Email: dr.carlospereira@teste.com');
    console.log('  Senha: senha123');
    console.log('  URL: telemed.com.br/dr/dr-carlospereira');
    console.log('\nMédico Híbrido:');
    console.log('  Email: dra.fernanda@teste.com');
    console.log('  Senha: senha123');
    console.log('  URL: telemed.com.br/dr/dra-fernanda');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  }
}

// Executar seed
seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

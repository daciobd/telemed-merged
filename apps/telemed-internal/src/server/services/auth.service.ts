import { db } from '../../db';
import { users, patients, doctors, virtualOfficeSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';

interface RegisterPatientData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  cpf?: string;
}

interface RegisterDoctorData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  cpf?: string;
  crm: string;
  crmState: string;
  specialties: string[];
  accountType?: 'marketplace' | 'virtual_office' | 'hybrid';
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  // Registrar paciente
  async registerPatient(data: RegisterPatientData) {
    // Verificar se email já existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const passwordHash = await hashPassword(data.password);

    // Criar usuário
    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        role: 'patient',
        fullName: data.fullName,
        phone: data.phone,
        cpf: data.cpf,
      })
      .returning();

    // Criar perfil de paciente
    const [patient] = await db
      .insert(patients)
      .values({
        userId: user.id,
      })
      .returning();

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      patient: {
        id: patient.id,
      },
      token,
    };
  }

  // Registrar médico
  async registerDoctor(data: RegisterDoctorData) {
    // Verificar se email já existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('Email já cadastrado');
    }

    // Verificar se CRM já existe
    const existingCRM = await db
      .select()
      .from(doctors)
      .where(eq(doctors.crm, data.crm))
      .limit(1);

    if (existingCRM.length > 0) {
      throw new Error('CRM já cadastrado');
    }

    // Hash da senha
    const passwordHash = await hashPassword(data.password);

    // Criar usuário
    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        role: 'doctor',
        fullName: data.fullName,
        phone: data.phone,
        cpf: data.cpf,
      })
      .returning();

    // Criar perfil de médico
    const [doctor] = await db
      .insert(doctors)
      .values({
        userId: user.id,
        crm: data.crm,
        crmState: data.crmState,
        specialties: data.specialties,
        accountType: data.accountType || 'marketplace',
        isAvailableMarketplace: data.accountType !== 'virtual_office',
      })
      .returning();

    // Se for consultório virtual ou híbrido, criar configurações
    if (data.accountType === 'virtual_office' || data.accountType === 'hybrid') {
      await db.insert(virtualOfficeSettings).values({
        doctorId: doctor.id,
      });
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      doctor: {
        id: doctor.id,
        crm: doctor.crm,
        accountType: doctor.accountType,
      },
      token,
    };
  }

  // Login
  async login(data: LoginData) {
    // Buscar usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      throw new Error('Email ou senha incorretos');
    }

    // Verificar senha
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Email ou senha incorretos');
    }

    // Buscar dados adicionais baseado no role
    let additionalData: any = {};

    if (user.role === 'patient') {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, user.id))
        .limit(1);
      additionalData.patientId = patient?.id;
    }

    if (user.role === 'doctor') {
      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, user.id))
        .limit(1);
      additionalData.doctorId = doctor?.id;
      additionalData.accountType = doctor?.accountType;
      additionalData.customUrl = doctor?.customUrl;
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        ...additionalData,
      },
      token,
    };
  }

  // Obter perfil do usuário autenticado
  async getMe(userId: number) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    let profile: any = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      cpf: user.cpf,
      role: user.role,
      profileImage: user.profileImage,
    };

    // Buscar dados adicionais
    if (user.role === 'patient') {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, user.id))
        .limit(1);

      if (patient) {
        profile.patient = {
          id: patient.id,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          address: patient.address,
        };
      }
    }

    if (user.role === 'doctor') {
      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, user.id))
        .limit(1);

      if (doctor) {
        profile.doctor = {
          id: doctor.id,
          crm: doctor.crm,
          crmState: doctor.crmState,
          specialties: doctor.specialties,
          accountType: doctor.accountType,
          customUrl: doctor.customUrl,
          bio: doctor.bio,
          rating: doctor.rating,
          isVerified: doctor.isVerified,
        };
      }
    }

    return profile;
  }
}

export default new AuthService();

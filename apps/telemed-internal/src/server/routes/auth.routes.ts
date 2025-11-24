import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate, schemas } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo paciente
 * @access  Public
 */
router.post(
  '/register',
  validate(schemas.registerPatient),
  authController.registerPatient
);

/**
 * @route   POST /api/auth/register/doctor
 * @desc    Registrar novo médico
 * @access  Public
 */
router.post(
  '/register/doctor',
  validate(schemas.registerDoctor),
  authController.registerDoctor
);

/**
 * @route   POST /api/auth/login
 * @desc    Login (paciente ou médico)
 * @access  Public
 */
router.post(
  '/login',
  validate(schemas.login),
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Obter perfil do usuário autenticado
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

export default router;

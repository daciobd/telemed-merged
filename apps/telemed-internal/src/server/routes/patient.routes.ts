import { Router } from 'express';
import patientController from '../controllers/patient.controller';
import { authenticate, requirePatient } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/patients/me
 * @desc    Buscar perfil do paciente autenticado
 * @access  Private (Patient only)
 */
router.get(
  '/me',
  authenticate,
  requirePatient,
  patientController.getMyProfile
);

/**
 * @route   PATCH /api/patients/me
 * @desc    Atualizar perfil do paciente
 * @access  Private (Patient only)
 */
router.patch(
  '/me',
  authenticate,
  requirePatient,
  patientController.updateMyProfile
);

/**
 * @route   GET /api/patients/consultations
 * @desc    Buscar consultas do paciente
 * @access  Private (Patient only)
 */
router.get(
  '/consultations',
  authenticate,
  requirePatient,
  patientController.getMyConsultations
);

/**
 * @route   GET /api/patients/doctors
 * @desc    Buscar médicos do paciente (consultório/favoritos)
 * @access  Private (Patient only)
 */
router.get(
  '/doctors',
  authenticate,
  requirePatient,
  patientController.getMyDoctors
);

/**
 * @route   GET /api/patients/dashboard
 * @desc    Dashboard do paciente (resumo de consultas, médicos, etc)
 * @access  Private (Patient only)
 */
router.get(
  '/dashboard',
  authenticate,
  requirePatient,
  patientController.getDashboard
);

/**
 * @route   POST /api/patients/doctors/:doctorId/favorite
 * @desc    Adicionar médico aos favoritos
 * @access  Private (Patient only)
 */
router.post(
  '/doctors/:doctorId/favorite',
  authenticate,
  requirePatient,
  patientController.addFavoriteDoctor
);

/**
 * @route   DELETE /api/patients/doctors/:doctorId/favorite
 * @desc    Remover médico dos favoritos
 * @access  Private (Patient only)
 */
router.delete(
  '/doctors/:doctorId/favorite',
  authenticate,
  requirePatient,
  patientController.removeFavoriteDoctor
);

export default router;

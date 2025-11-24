import { Router } from 'express';
import virtualOfficeController from '../controllers/virtual-office.controller';
import { authenticate, requireDoctor } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/dr/:customUrl
 * @desc    Página pública do consultório (ex: /api/dr/dr-joaosilva)
 * @access  Public
 */
router.get('/:customUrl', virtualOfficeController.getPublicPage);

/**
 * @route   GET /api/virtual-office/settings
 * @desc    Buscar configurações do consultório do médico autenticado
 * @access  Private (Doctor only)
 */
router.get(
  '/settings',
  authenticate,
  requireDoctor,
  virtualOfficeController.getSettings
);

/**
 * @route   PATCH /api/virtual-office/settings
 * @desc    Atualizar configurações do consultório
 * @access  Private (Doctor only)
 */
router.patch(
  '/settings',
  authenticate,
  requireDoctor,
  validate(schemas.updateVirtualOfficeSettings),
  virtualOfficeController.updateSettings
);

/**
 * @route   GET /api/virtual-office/schedule
 * @desc    Buscar agenda do médico
 * @access  Private (Doctor only)
 * @query   ?startDate=2024-11-01&endDate=2024-11-30
 */
router.get(
  '/schedule',
  authenticate,
  requireDoctor,
  virtualOfficeController.getSchedule
);

/**
 * @route   GET /api/virtual-office/my-patients
 * @desc    Buscar pacientes do consultório
 * @access  Private (Doctor only)
 */
router.get(
  '/my-patients',
  authenticate,
  requireDoctor,
  virtualOfficeController.getMyPatients
);

/**
 * @route   POST /api/virtual-office/check-availability
 * @desc    Verificar disponibilidade de horário
 * @access  Public
 */
router.post(
  '/check-availability',
  virtualOfficeController.checkAvailability
);

export default router;

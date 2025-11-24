import { Router } from 'express';
import doctorController from '../controllers/doctor.controller';
import { authenticate, requireDoctor } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/doctors
 * @desc    Listar todos os médicos ativos
 * @access  Public
 * @query   ?specialty=Cardiologia&accountType=virtual_office
 */
router.get('/', doctorController.getAllDoctors);

/**
 * @route   GET /api/doctors/marketplace
 * @desc    Listar médicos disponíveis no marketplace
 * @access  Public
 * @query   ?specialty=Cardiologia
 */
router.get('/marketplace', doctorController.getMarketplaceDoctors);

/**
 * @route   GET /api/doctors/virtual-office
 * @desc    Listar médicos com consultório virtual
 * @access  Public
 */
router.get('/virtual-office', doctorController.getVirtualOfficeDoctors);

/**
 * @route   GET /api/doctors/search
 * @desc    Buscar médicos por nome, CRM ou especialidade
 * @access  Public
 * @query   ?q=termo
 */
router.get('/search', doctorController.searchDoctors);

/**
 * @route   GET /api/doctors/check-url/:customUrl
 * @desc    Verificar disponibilidade de URL customizada
 * @access  Public
 */
router.get('/check-url/:customUrl', doctorController.checkUrlAvailability);

/**
 * @route   PATCH /api/doctors/me
 * @desc    Atualizar perfil do médico autenticado
 * @access  Private (Doctor only)
 */
router.patch(
  '/me',
  authenticate,
  requireDoctor,
  validate(schemas.updateDoctorProfile),
  doctorController.updateMyProfile
);

/**
 * @route   GET /api/doctors/:id
 * @desc    Buscar médico por ID
 * @access  Public
 */
router.get('/:id', doctorController.getDoctorById);

export default router;

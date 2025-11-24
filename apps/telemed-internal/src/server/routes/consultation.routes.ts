import { Router } from 'express';
import consultationController from '../controllers/consultation.controller';
import { authenticate, requirePatient, requireDoctor } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/consultations/marketplace
 * @desc    Criar consulta no marketplace (leilão reverso)
 * @access  Private (Patient only)
 */
router.post(
  '/marketplace',
  authenticate,
  requirePatient,
  validate(schemas.createMarketplaceConsultation),
  consultationController.createMarketplaceConsultation
);

/**
 * @route   POST /api/consultations/direct
 * @desc    Agendar consulta direta (consultório virtual)
 * @access  Private (Patient only)
 */
router.post(
  '/direct',
  authenticate,
  requirePatient,
  validate(schemas.createDirectConsultation),
  consultationController.createDirectConsultation
);

/**
 * @route   GET /api/consultations
 * @desc    Listar consultas do usuário autenticado
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  consultationController.getMyConsultations
);

/**
 * @route   GET /api/consultations/marketplace/pending
 * @desc    Listar consultas pendentes do marketplace (para médicos fazerem lances)
 * @access  Private (Doctor only)
 */
router.get(
  '/marketplace/pending',
  authenticate,
  requireDoctor,
  consultationController.getPendingMarketplace
);

/**
 * @route   GET /api/consultations/:id
 * @desc    Buscar detalhes de uma consulta
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  consultationController.getConsultationById
);

/**
 * @route   PATCH /api/consultations/:id
 * @desc    Atualizar informações da consulta
 * @access  Private (Doctor only)
 */
router.patch(
  '/:id',
  authenticate,
  requireDoctor,
  consultationController.updateConsultation
);

/**
 * @route   DELETE /api/consultations/:id
 * @desc    Cancelar consulta
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  consultationController.cancelConsultation
);

/**
 * @route   POST /api/consultations/:id/start
 * @desc    Iniciar consulta (gerar/fornecer link de videochamada)
 * @access  Private (Doctor only)
 */
router.post(
  '/:id/start',
  authenticate,
  requireDoctor,
  consultationController.startConsultation
);

/**
 * @route   POST /api/consultations/:id/complete
 * @desc    Finalizar consulta (adicionar notas clínicas, diagnóstico, etc)
 * @access  Private (Doctor only)
 */
router.post(
  '/:id/complete',
  authenticate,
  requireDoctor,
  consultationController.completeConsultation
);

/**
 * @route   POST /api/consultations/:id/rate
 * @desc    Avaliar consulta (paciente avalia médico)
 * @access  Private (Patient only)
 */
router.post(
  '/:id/rate',
  authenticate,
  requirePatient,
  consultationController.rateConsultation
);

export default router;

import { Router } from 'express';
import bidController from '../controllers/bid.controller';
import { authenticate, requireDoctor, requirePatient } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/consultations/:id/bid
 * @desc    Fazer lance em uma consulta do marketplace
 * @access  Private (Doctor only)
 */
router.post(
  '/consultations/:id/bid',
  authenticate,
  requireDoctor,
  validate(schemas.createBid),
  bidController.createBid
);

/**
 * @route   GET /api/consultations/:id/bids
 * @desc    Listar lances de uma consulta
 * @access  Private
 */
router.get(
  '/consultations/:id/bids',
  authenticate,
  bidController.getConsultationBids
);

/**
 * @route   POST /api/consultations/:consultationId/accept-bid/:bidId
 * @desc    Aceitar um lance
 * @access  Private (Patient only)
 */
router.post(
  '/consultations/:consultationId/accept-bid/:bidId',
  authenticate,
  requirePatient,
  bidController.acceptBid
);

/**
 * @route   GET /api/bids/my-bids
 * @desc    Buscar meus lances (médico)
 * @access  Private (Doctor only)
 */
router.get(
  '/my-bids',
  authenticate,
  requireDoctor,
  bidController.getMyBids
);

/**
 * @route   PATCH /api/bids/:id
 * @desc    Atualizar lance (contra-proposta)
 * @access  Private (Doctor only)
 */
router.patch(
  '/:id',
  authenticate,
  requireDoctor,
  bidController.updateBid
);

/**
 * @route   DELETE /api/bids/:id
 * @desc    Rejeitar/cancelar lance
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  bidController.rejectBid
);

export default router;

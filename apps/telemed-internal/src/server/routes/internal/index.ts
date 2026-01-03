import { Router } from 'express';
import { internalOnly } from '../../middleware/internalOnly.middleware';
import marketingRouter from './marketing.routes';
import paymentsRouter from './payments.routes';

const router = Router();

router.use(internalOnly); // 🔒 protege tudo abaixo

router.use('/marketing', marketingRouter);
router.use(paymentsRouter);

export default router;

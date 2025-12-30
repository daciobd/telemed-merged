import { Router } from 'express';
import { internalOnly } from '../../middleware/internalOnly.middleware';
import marketingRouter from './marketing.routes';

const router = Router();

router.use(internalOnly); // 🔒 protege tudo abaixo

router.use('/marketing', marketingRouter);

// Adicione outras rotas internas aqui no futuro
// import analyticsRouter from './analytics.routes';
// router.use('/analytics', analyticsRouter);

export default router;

import { Router } from 'express';
import * as sessionsController from '../controllers/sessionsController';

const router = Router();

router.get('/', sessionsController.getSessions);

router.post('/', sessionsController.addSession);

router.get('/seed', sessionsController.seedSessions);

export default router;

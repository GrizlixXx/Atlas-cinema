import { Router } from 'express';
import * as bookingsController from '../controllers/bookingsController';

const router = Router();

router.get('/', bookingsController.getAll);

router.get('/occupied/:sessionId', bookingsController.getOccupied);

router.post('/', bookingsController.create);

router.patch('/:id/pay', bookingsController.pay);

router.patch('/pay-all', bookingsController.payAll);

router.patch('/:id/cancel', bookingsController.cancel);

router.delete('/:id', bookingsController.remove);

export default router;

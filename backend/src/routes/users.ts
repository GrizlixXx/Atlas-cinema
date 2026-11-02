import { Router } from 'express';
import * as usersController from '../controllers/usersController';

const router = Router();

router.get('/', usersController.getUsers);

router.post('/register', usersController.register);

router.get('/ensure-admin', usersController.ensureAdmin);

export default router;

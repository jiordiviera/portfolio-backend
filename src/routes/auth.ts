import express from 'express';
import UserController from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', UserController.register as express.RequestHandler);
router.post('/login', UserController.login as express.RequestHandler);
router.put('/profile', authenticateToken as express.RequestHandler, UserController.updateProfile as express.RequestHandler)

export default router;

import express from 'express';
import UserController from '../controllers/UserController';

const router = express.Router();

router.post('/register', UserController.register as express.RequestHandler);
router.post('/login', UserController.login as express.RequestHandler);

export default router;

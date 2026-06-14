import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.get('/me', authMiddleware, authController.me.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));

export default router;


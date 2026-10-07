import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { authenticateToken } from '../../../middlewares/auth.middleware.js';

const router = Router();

/**
 * Routes under /api/webapp/auth
 */
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.patch('/me', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;

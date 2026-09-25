import { Router } from 'express';
import {
  getWebAppStatus,
  getWebAppDashboardSummary,
} from '../controllers/webapp.controller.js';
import authRoutes from './auth.routes.js';

const router = Router();

/**
 * All routes here are mounted under: /api/webapp
 */
router.use('/auth', authRoutes);
router.get('/status', getWebAppStatus);
router.get('/dashboard', getWebAppDashboardSummary);

export default router;

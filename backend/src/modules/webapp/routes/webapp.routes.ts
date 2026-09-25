import { Router } from 'express';
import {
  getWebAppStatus,
  getWebAppDashboardSummary,
} from '../controllers/webapp.controller.js';

const router = Router();

/**
 * All routes here are mounted under: /api/webapp
 */
router.get('/status', getWebAppStatus);
router.get('/dashboard', getWebAppDashboardSummary);

export default router;

import { Router } from 'express';
import {
  getWebAppStatus,
  getWebAppDashboardSummary,
} from '../controllers/webapp.controller.js';
import {
  getParks,
  getAnalyticsSummary,
  generateReport,
  getReports,
  getReportById,
} from '../controllers/report.controller.js';
import { optionalAuthenticateToken } from '../../../middlewares/auth.middleware.js';
import authRoutes from './auth.routes.js';

const router = Router();

/**
 * All routes here are mounted under: /api/webapp
 */
router.use('/auth', authRoutes);
router.get('/status', getWebAppStatus);
router.get('/dashboard', getWebAppDashboardSummary);

// --- UC04: Nisal's Conservation Reports & Analytics ---
router.get('/parks', getParks);
router.get('/analytics/summary', getAnalyticsSummary);
router.post('/reports/generate', optionalAuthenticateToken, generateReport);
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);

export default router;

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
import {
  getMonitoringOverview,
  getAnimals,
  getAnimalById,
  getRiskZones,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  simulatePing,
} from '../controllers/wildlife.controller.js';
import { optionalAuthenticateToken } from '../../../middlewares/auth.middleware.js';
import authRoutes from './auth.routes.js';

const router = Router();

/**
 * All routes here are mounted under: /api/webapp
 */
router.use('/auth', authRoutes);
router.use('/monitoring/alerts/:id/acknowledge', optionalAuthenticateToken, acknowledgeAlert);
router.use('/monitoring/alerts/:id/resolve', optionalAuthenticateToken, resolveAlert);

router.get('/status', getWebAppStatus);
router.get('/dashboard', getWebAppDashboardSummary);

// --- UC04: Conservation Reports & Analytics ---
router.get('/parks', getParks);
router.get('/analytics/summary', getAnalyticsSummary);
router.post('/reports/generate', optionalAuthenticateToken, generateReport);
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);

// --- Wildlife Monitoring & Collared Animal Tracking ---
router.get('/monitoring/overview', getMonitoringOverview);
router.get('/monitoring/animals', getAnimals);
router.get('/monitoring/animals/:id', getAnimalById);
router.get('/monitoring/zones', getRiskZones);
router.get('/monitoring/alerts', getAlerts);
router.get('/monitoring/alerts/:id', getAlertById);
router.post('/monitoring/simulate-ping', simulatePing);

export default router;

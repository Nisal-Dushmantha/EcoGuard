import { Router } from 'express';
import {
  getMobileStatus,
  getMobileFeed,
} from '../controllers/mobile.controller.js';

import incidentRoutes from './incident.routes.js';
import { rangerLogin } from '../controllers/incident.controller.js';

const router = Router();

/**
 * All routes here are mounted under: /api/mobile
 */
router.get('/status', getMobileStatus);
router.get('/feed', getMobileFeed);

// Ranger authentication endpoint: /api/mobile/auth/login
router.post('/auth/login', rangerLogin);

// Mount UC01 Incident Logging Routes under /api/mobile/incidents
router.use('/incidents', incidentRoutes);

export default router;

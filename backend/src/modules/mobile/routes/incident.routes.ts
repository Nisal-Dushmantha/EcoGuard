import { Router } from 'express';
import {
  createIncident,
  getRangerIncidents,
  getIncidentById,
  syncIncidents,
  rangerLogin,
} from '../controllers/incident.controller.js';
import { optionalAuthenticateToken } from '../../../middlewares/auth.middleware.js';

const router = Router();

// Apply authentication middleware to parse JWT tokens if present
router.use(optionalAuthenticateToken);

// Authentication for field rangers
router.post('/auth/login', rangerLogin);

// Core UC01 Incident routes
router.post('/', createIncident);
router.post('/sync', syncIncidents);
router.get('/ranger/:rangerId', getRangerIncidents);
router.get('/:incidentId', getIncidentById);

export default router;

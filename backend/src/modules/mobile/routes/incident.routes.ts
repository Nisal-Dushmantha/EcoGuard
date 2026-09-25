import { Router } from 'express';
import {
  createIncident,
  getRangerIncidents,
  getIncidentById,
  syncIncidents,
  rangerLogin,
} from '../controllers/incident.controller.js';

const router = Router();

// Authentication for field rangers
router.post('/auth/login', rangerLogin);

// Core UC01 Incident routes
router.post('/', createIncident);
router.post('/sync', syncIncidents);
router.get('/ranger/:rangerId', getRangerIncidents);
router.get('/:incidentId', getIncidentById);

export default router;

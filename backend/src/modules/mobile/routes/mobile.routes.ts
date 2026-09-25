import { Router } from 'express';
import {
  getMobileStatus,
  getMobileFeed,
} from '../controllers/mobile.controller.js';

const router = Router();

/**
 * All routes here are mounted under: /api/mobile
 */
router.get('/status', getMobileStatus);
router.get('/feed', getMobileFeed);

export default router;

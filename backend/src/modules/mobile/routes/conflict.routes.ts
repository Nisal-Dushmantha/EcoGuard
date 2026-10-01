import { Router } from 'express';
import { getDashboardSummary } from '../controllers/conflict.controller.js';

const router = Router();

router.get('/dashboard-summary', getDashboardSummary);

export default router;

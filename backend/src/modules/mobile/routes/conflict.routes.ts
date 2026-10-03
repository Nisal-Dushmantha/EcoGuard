import { Router } from 'express';
import {
  getDashboardSummary,
  getConflictReports,
  getConflictReportById,
  verifyConflictReport,
  rejectConflictReport,
  dispatchConflictReport,
  updateConflictStatus,
  createConflictReport,
  getCommunityMemberDashboard,
} from '../controllers/conflict.controller.js';
import { authenticateToken, requireRole } from '../../../middlewares/auth.middleware.js';

const router = Router();

// Dashboard summary (Operations Home)
router.get(
  '/dashboard-summary',
  authenticateToken,
  requireRole(['Community Liaison Officer']),
  getDashboardSummary
);

// Community Member Dashboard
router.get(
  '/member-dashboard',
  authenticateToken,
  getCommunityMemberDashboard
);

// Submit a new conflict report (Community Member & Mobile users)
router.post('/reports', authenticateToken, createConflictReport);

// Conflict Reports list with filters/search/sort
router.get('/reports', getConflictReports);

// Single report details
router.get('/reports/:reportId', getConflictReportById);

// Verify a pending report
router.patch('/reports/:reportId/verify', verifyConflictReport);

// Reject a pending report (body: { reason: string })
router.patch('/reports/:reportId/reject', rejectConflictReport);

// Dispatch a verified report (body: { rangerId: string, notes?: string, dispatchedBy?: string })
router.patch('/reports/:reportId/dispatch', dispatchConflictReport);

// Update status (e.g. IN_PROGRESS, RESOLVED)
router.patch('/reports/:reportId/status', updateConflictStatus);

export default router;

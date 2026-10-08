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
  uploadEvidencePhoto,
  getRangerAssignedReports,
} from '../controllers/conflict.controller.js';
import { authenticateToken, requireRole } from '../../../middlewares/auth.middleware.js';
import { evidenceUpload } from '../../../middlewares/upload.middleware.js';

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

// Upload evidence photo (multipart/form-data) — returns persistent URL
// Must be called BEFORE createConflictReport so the JSON payload only carries a URL.
//
// The multer error wrapper ensures multer errors (wrong field name, file too large,
// unsupported mime type) return a JSON 400 instead of hanging or crashing.
router.post(
  '/upload-photo',
  authenticateToken,
  (req, res, next) => {
    console.log('[upload-photo] Multer middleware entering. Content-Type:', req.headers['content-type']);
    evidenceUpload.single('photo')(req, res, (err) => {
      if (err) {
        console.error('[upload-photo] Multer error:', err.message);
        res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
        return;
      }
      console.log('[upload-photo] Multer processed OK. req.file present:', !!req.file);
      next();
    });
  },
  uploadEvidencePhoto
);

// Submit a new conflict report (Community Member & Mobile users)
router.post('/reports', authenticateToken, createConflictReport);

// Conflict Reports list with filters/search/sort
router.get('/reports', authenticateToken, getConflictReports);

// Ranger assigned reports
router.get('/assigned-to-me', authenticateToken, getRangerAssignedReports);
router.get('/ranger-assigned/:rangerId?', authenticateToken, getRangerAssignedReports);
router.get('/ranger-assigned', authenticateToken, getRangerAssignedReports);

// Single report details
router.get('/reports/:reportId', authenticateToken, getConflictReportById);

// Verify a pending report
router.patch(
  '/reports/:reportId/verify',
  authenticateToken,
  requireRole(['Community Liaison Officer']),
  verifyConflictReport
);

// Reject a pending report (body: { reason: string })
router.patch(
  '/reports/:reportId/reject',
  authenticateToken,
  requireRole(['Community Liaison Officer']),
  rejectConflictReport
);

// Dispatch a verified report (body: { rangerId: string, notes?: string, dispatchedBy?: string })
router.patch(
  '/reports/:reportId/dispatch',
  authenticateToken,
  requireRole(['Community Liaison Officer']),
  dispatchConflictReport
);

// Update status (e.g. IN_PROGRESS, RESOLVED)
router.patch('/reports/:reportId/status', authenticateToken, updateConflictStatus);

export default router;

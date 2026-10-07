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

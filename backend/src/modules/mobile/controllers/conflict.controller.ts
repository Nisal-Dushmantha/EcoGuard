import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { CommunityReport } from '../../../models/CommunityReport.model.js';
import { User } from '../../../models/User.model.js';
import { AuthenticatedRequest } from '../../../middlewares/auth.middleware.js';
import { UPLOADS_DIR } from '../../../middlewares/upload.middleware.js';

export const getDashboardSummary = async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const officer = await User.findById(userId).select('-password').lean();
    if (!officer) {
      res.status(404).json({ success: false, message: 'Officer not found' });
      return;
    }

    console.log(`[DEBUG] Logged-in user ID: ${userId}`);
    console.log(`[DEBUG] Fetched officer: ${officer.name}, Role: ${officer.role}, assignedPark: ${officer.assignedPark}`);

    const park = officer.assignedPark;
    const filter: any = {};
    if (park) {
      filter.park = park;
    }

    const pendingCount = await CommunityReport.countDocuments({ ...filter, status: 'Pending Verification' });
    const verifiedCount = await CommunityReport.countDocuments({ ...filter, status: 'Verified' });
    const dispatchedCount = await CommunityReport.countDocuments({ ...filter, status: 'Dispatched' });

    console.log(`[DEBUG] Fetched counts - Pending: ${pendingCount}, Verified: ${verifiedCount}, Dispatched: ${dispatchedCount}`);

    const needsAttention = await CommunityReport.find({
      ...filter,
      status: { $in: ['Pending Verification', 'Dispatched'] }
    })
      .sort({ reportedAt: 1 })
      .limit(10)
      .lean();

    const severityWeight: Record<string, number> = {
      'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1
    };

    needsAttention.sort((a, b) => {
      const weightA = severityWeight[a.severity] || 0;
      const weightB = severityWeight[b.severity] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
    });

    const responseData = {
      officer,
      stats: {
        pending: pendingCount,
        verified: verifiedCount,
        dispatched: dispatchedCount,
      },
      reports: needsAttention.slice(0, 5),
    };

    console.log(`[DEBUG] Dashboard API Response:`, JSON.stringify(responseData, null, 2));

    res.json({
      success: true,
      data: responseData
    });
  } catch (err: any) {
    console.error('Error in getDashboardSummary:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/mobile/conflicts/reports
 * Query params:
 *   status    - comma-separated statuses, default: 'Pending Verification'
 *   search    - text search across reportId, locationName, animalSpecies, conflictType
 *   severity  - filter by severity: Low | Medium | High | Critical
 *   animal    - filter by animalSpecies
 *   park      - filter by park name
 *   sort      - 'newest' (default) | 'oldest' | 'severity'
 *   limit     - number of results (default 50)
 */
export const getConflictReports = async (req: Request, res: Response) => {
  try {
    const {
      status,
      reporterId,
      assignedRangerId,
      search,
      severity,
      animal,
      park,
      sort = 'newest',
      limit = '50',
    } = req.query as Record<string, string>;

    const andConditions: any[] = [];

    // Status - support comma-separated list or optional 'all'
    if (status && status !== 'all' && status !== 'All') {
      const statuses = status.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        andConditions.push({ status: statuses[0] });
      } else if (statuses.length > 1) {
        andConditions.push({ status: { $in: statuses } });
      }
    }

    // Reporter ID / Name filter
    if (reporterId) {
      const userId = (req as AuthenticatedRequest).user?.id || reporterId;
      const userName = (req as AuthenticatedRequest).user?.name;
      const conditions: any[] = [{ reporterId: userId }];
      if (userName) {
        conditions.push({ reporterName: userName });
      }
      andConditions.push({ $or: conditions });
    }

    // Assigned Ranger ID / Name filter
    if (assignedRangerId) {
      if (assignedRangerId === 'any') {
        andConditions.push({ assignedRangerId: { $exists: true, $ne: '' } });
      } else {
        andConditions.push({
          $or: [
            { assignedRangerId: assignedRangerId },
            { assignedRangerName: new RegExp(assignedRangerId, 'i') },
            { actionTaken: new RegExp(assignedRangerId, 'i') },
          ],
        });
      }
    }

    // Optional field filters
    if (severity) andConditions.push({ severity });
    if (animal) andConditions.push({ animalSpecies: animal });
    if (park) andConditions.push({ park });

    // Text search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      andConditions.push({
        $or: [
          { reportId: regex },
          { locationName: regex },
          { animalSpecies: regex },
          { conflictType: regex },
          { description: regex },
          { reporterName: regex },
          { assignedRangerName: regex },
          { officerNotes: regex },
        ],
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    // Sort
    let sortObj: any = { reportedAt: -1 };
    if (sort === 'oldest') sortObj = { reportedAt: 1 };

    const maxLimit = Math.min(parseInt(limit, 10) || 50, 200);

    // For severity sort fetch extra, then re-sort in memory (string enum)
    const fetchLimit = sort === 'severity' ? maxLimit * 3 : maxLimit;
    const reports = await CommunityReport.find(filter)
      .sort(sortObj)
      .limit(fetchLimit)
      .lean();

    let finalReports = reports;
    if (sort === 'severity') {
      const severityWeight: Record<string, number> = {
        'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1
      };
      finalReports = reports
        .sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0))
        .slice(0, maxLimit);
    }

    const totalCount = await CommunityReport.countDocuments(filter);

    res.json({
      success: true,
      data: {
        reports: finalReports,
        total: totalCount,
      }
    });
  } catch (err: any) {
    console.error('Error in getConflictReports:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/mobile/conflicts/reports/:reportId
 * Fetch a single conflict report by its reportId field (e.g. "CR-1004")
 */
export const getConflictReportById = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await CommunityReport.findOne({ reportId }).lean();
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }
    res.json({ success: true, data: report });
  } catch (err: any) {
    console.error('Error in getConflictReportById:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/mobile/conflicts/reports/:reportId/verify
 * Verify a pending conflict report.
 * Only 'Pending Verification' reports can be verified.
 */
export const verifyConflictReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { verifiedBy } = req.body; // CLO name passed from mobile app

    const report = await CommunityReport.findOne({ reportId });
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    if (report.status !== 'Pending Verification') {
      res.status(400).json({
        success: false,
        message: `Report cannot be verified. Current status: "${report.status}". Only Pending Verification reports can be verified.`,
      });
      return;
    }

    report.status = 'Verified';
    report.verifiedBy = verifiedBy?.trim() || 'Community Liaison Officer';
    report.verifiedAt = new Date();
    report.actionTaken = report.actionTaken || `Verified by ${report.verifiedBy}`;
    await report.save();

    res.json({
      success: true,
      message: 'Report verified successfully.',
      data: report.toObject(),
    });
  } catch (err: any) {
    console.error('Error in verifyConflictReport:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/mobile/conflicts/reports/:reportId/reject
 * Reject a pending conflict report.
 * Body: { reason: string }
 * Only 'Pending Verification' reports can be rejected.
 */
export const rejectConflictReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({ success: false, message: 'Rejection reason is required.' });
      return;
    }

    const report = await CommunityReport.findOne({ reportId });
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    if (report.status !== 'Pending Verification') {
      res.status(400).json({
        success: false,
        message: `Report cannot be rejected. Current status: "${report.status}". Only Pending Verification reports can be rejected.`,
      });
      return;
    }

    report.status = 'Rejected';
    report.rejectionReason = reason.trim();
    await report.save();

    res.json({
      success: true,
      message: 'Report rejected.',
      data: report.toObject(),
    });
  } catch (err: any) {
    console.error('Error in rejectConflictReport:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/mobile/conflicts/reports/:reportId/dispatch
 * Assign a ranger to a conflict report and mark it as dispatched.
 */
export const dispatchConflictReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { rangerId, notes, dispatchedBy } = req.body;

    if (!rangerId) {
      res.status(400).json({ success: false, message: 'Ranger ID is required.' });
      return;
    }

    const report = await CommunityReport.findOne({ reportId });
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    if (report.status === 'Dispatched') {
      res.status(400).json({
        success: false,
        message: 'This report has already been dispatched.',
      });
      return;
    }

    if (report.status !== 'Verified') {
      res.status(400).json({
        success: false,
        message: `Report cannot be dispatched. Current status: "${report.status}". Only Verified reports can be dispatched.`,
      });
      return;
    }

    // Verify ranger exists (using Mongoose ObjectId assuming rangerId is _id for User)
    // Note: If rangerId is not a valid ObjectId, this will throw an error, so we catch it
    let ranger = null;
    try {
      ranger = await User.findById(rangerId);
    } catch (e) {
      // Invalid ObjectId format
    }

    if (!ranger) {
      ranger = await User.findOne({
        $or: [{ officerId: rangerId }, { email: rangerId }, { name: rangerId }],
      });
    }

    if (!ranger) {
      res.status(404).json({ success: false, message: 'Selected ranger not found.' });
      return;
    }

    if (ranger.role !== 'Ranger') {
      res.status(400).json({ success: false, message: 'Selected user is not a Ranger.' });
      return;
    }

    // Assign report
    report.status = 'Dispatched';
    report.assignedRangerId = ranger._id.toString();
    report.assignedRangerName = ranger.name;
    report.dispatchedBy = dispatchedBy?.trim() || 'Community Liaison Officer';
    report.dispatchedAt = new Date();
    report.officerNotes = notes?.trim() || '';
    report.actionTaken = report.actionTaken || `Dispatched Ranger ${ranger.name}`;

    await report.save();

    res.json({
      success: true,
      message: 'Ranger dispatched successfully.',
      data: report.toObject(),
    });
  } catch (err: any) {
    console.error('Error in dispatchConflictReport:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/mobile/conflicts/reports/:reportId/status
 * Update status of a report (e.g. IN_PROGRESS, RESOLVED)
 * Only the assigned Ranger is allowed to trigger these field status transitions.
 */
export const updateConflictStatus = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized: Authentication token is required.' });
      return;
    }

    const { reportId } = req.params;
    const { status, note, resolutionNote } = req.body;

    const report = await CommunityReport.findOne({ reportId });
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    const targetStatus = status || req.body.newStatus;
    const noteText = (resolutionNote || note || '').trim();

    // 1. Role Enforcement: Officer role is NOT allowed to trigger field response status updates
    if (user.role === 'Community Liaison Officer') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Community Liaison Officers cannot mark reports as In Progress or Resolved. Only the assigned Ranger can perform field response updates.',
      });
      return;
    }

    // 2. Ranger Role & Ownership Check
    if (user.role === 'Ranger') {
      const rangerIdStr = user.id?.toString() || (user as any)._id?.toString() || '';
      const officerIdStr = user.officerId || '';
      const rangerName = user.name || '';

      const isAssigned =
        (rangerIdStr && report.assignedRangerId === rangerIdStr) ||
        (officerIdStr && report.assignedRangerId === officerIdStr) ||
        (rangerName && report.assignedRangerName?.toLowerCase() === rangerName.toLowerCase());

      if (!isAssigned) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not assigned to this conflict report.',
        });
        return;
      }
    } else {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned Ranger can update response status or resolve conflict reports.',
      });
      return;
    }

    // 3. Strict Transition Validation
    // Allowed transitions:
    // DISPATCHED -> IN_PROGRESS
    // IN_PROGRESS -> RESOLVED
    if (targetStatus === 'In Progress') {
      if (report.status !== 'Dispatched') {
        res.status(400).json({
          success: false,
          message: `Cannot change status to "In Progress". Current status: "${report.status}". Report must be Dispatched.`,
        });
        return;
      }
      report.status = 'In Progress';
      report.inProgressAt = new Date();
      if (noteText) {
        report.officerNotes = report.officerNotes
          ? `${report.officerNotes}\n[In Progress - Ranger ${user.name}]: ${noteText}`
          : `[In Progress - Ranger ${user.name}]: ${noteText}`;
      }
    } else if (targetStatus === 'Resolved') {
      if (report.status !== 'In Progress') {
        if (report.status === 'Dispatched') {
          res.status(400).json({
            success: false,
            message: 'Invalid status transition. Report must be set to "In Progress" before it can be resolved.',
          });
          return;
        }
        res.status(400).json({
          success: false,
          message: `Cannot resolve report. Current status is "${report.status}". Report must be In Progress before resolving.`,
        });
        return;
      }

      if (!noteText) {
        res.status(400).json({
          success: false,
          message: 'Resolution notes are required to resolve a conflict report.',
        });
        return;
      }

      report.status = 'Resolved';
      report.resolvedAt = new Date();
      report.resolvedBy = user.name || 'Ranger';
      report.resolutionNote = noteText;
      report.officerNotes = report.officerNotes
        ? `${report.officerNotes}\n[Resolved by Ranger ${user.name}]: ${noteText}`
        : `[Resolved by Ranger ${user.name}]: ${noteText}`;
    } else {
      res.status(400).json({
        success: false,
        message: `Invalid status transition to "${targetStatus}". Allowed field transitions are "In Progress" and "Resolved".`,
      });
      return;
    }

    await report.save();

    res.json({
      success: true,
      message: `Status updated to ${report.status}.`,
      data: report.toObject(),
    });
  } catch (err: any) {
    console.error('Error in updateConflictStatus:', err);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

/**
 * POST /api/mobile/conflicts/reports
 * Submit a new conflict report (Used by Community Members)
 */
export const createConflictReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    const userName = (req as AuthenticatedRequest).user?.name;

    const {
      reporterName,
      contactNumber,
      conflictType,
      animalSpecies,
      animalType,
      severity = 'Medium',
      locationName,
      location,
      park = 'Yala National Park',
      latitude,
      longitude,
      description,
      photoUrl,
      photoUri,
    } = req.body;

    const rName = reporterName || userName || 'Community Member';
    const rContact = contactNumber || '';
    const locName = locationName || location || 'Local Sector';
    const species = animalSpecies || animalType || 'Asian Elephant';
    const finalPhoto = photoUrl || photoUri || '';

    // Auto generate unique reportId e.g. CR-2026-XXXX
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const reportId = `CR-2026-${randomCode}`;

    const newReport = await CommunityReport.create({
      reportId,
      reporterName: rName.trim(),
      contactNumber: rContact.trim(),
      reporterId: userId || '',
      park: park.trim(),
      locationName: locName.trim(),
      coordinates: (latitude && longitude) ? { latitude: Number(latitude), longitude: Number(longitude) } : undefined,
      conflictType: conflictType || 'Other Conflict',
      animalSpecies: species,
      severity: ['Low', 'Medium', 'High', 'Critical'].includes(severity) ? severity : 'Medium',
      reportedAt: new Date(),
      status: 'Pending Verification',
      description: (description || '').trim(),
      photoUrl: finalPhoto,
    });

    console.log(`[Backend] Created Community Conflict Report: ${newReport.reportId} (Status: Pending Verification)`);

    res.status(201).json({
      success: true,
      message: 'Conflict report submitted successfully.',
      data: newReport.toObject(),
    });
  } catch (err: any) {
    console.error('Error in createConflictReport:', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to submit conflict report' });
  }
};

/**
 * GET /api/mobile/conflicts/member-dashboard
 * Dashboard stats & recent reports for logged-in Community Member
 */
export const getCommunityMemberDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    const userName = (req as AuthenticatedRequest).user?.name;

    const filter: any = {};
    if (userId || userName) {
      const conditions: any[] = [];
      if (userId) conditions.push({ reporterId: userId });
      if (userName) conditions.push({ reporterName: userName });
      filter.$or = conditions;
    }

    const totalCount = await CommunityReport.countDocuments(filter);
    const pendingCount = await CommunityReport.countDocuments({ ...filter, status: 'Pending Verification' });
    const inProgressCount = await CommunityReport.countDocuments({ ...filter, status: { $in: ['Dispatched', 'In Progress', 'Verified'] } });
    const resolvedCount = await CommunityReport.countDocuments({ ...filter, status: 'Resolved' });

    const recentReports = await CommunityReport.find(filter)
      .sort({ reportedAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        stats: {
          myReports: totalCount,
          pending: pendingCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
        },
        reports: recentReports,
      },
    });
  } catch (err: any) {
    console.error('Error in getCommunityMemberDashboard:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/mobile/conflicts/upload-photo
 * Accepts multipart/form-data with a single field named 'photo'.
 * Uses memoryStorage — req.file.buffer is written to disk here.
 * Returns { success: true, data: { photoUrl } } on success.
 */
export const uploadEvidencePhoto = async (req: Request, res: Response): Promise<void> => {
  console.log('\n══ [upload-photo] Route handler ENTERED ══');
  console.log('[upload-photo] Method:', req.method);
  console.log('[upload-photo] Content-Type:', req.headers['content-type']);
  console.log('[upload-photo] req.file present:', !!req.file);

  if (req.file) {
    console.log('[upload-photo] req.file.fieldname:', req.file.fieldname);
    console.log('[upload-photo] req.file.originalname:', req.file.originalname);
    console.log('[upload-photo] req.file.mimetype:', req.file.mimetype);
    console.log('[upload-photo] req.file.size:', req.file.size, 'bytes');
    console.log('[upload-photo] req.file.buffer present:', !!req.file.buffer, '| buffer length:', req.file.buffer?.length);
  }

  try {
    if (!req.file || !req.file.buffer) {
      console.warn('[upload-photo] ✗ No file/buffer in request — returning 400.');
      res.status(400).json({
        success: false,
        message: "No photo received. Send the image as a multipart/form-data field named 'photo'.",
      });
      return;
    }

    // Build a unique filename and write the buffer to disk
    const ext = path.extname(req.file.originalname || '.jpg') || '.jpg';
    const filename = `evidence-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    console.log('[upload-photo] Writing buffer to disk:', filePath);
    fs.writeFileSync(filePath, req.file.buffer);
    console.log('[upload-photo] ✓ File written to disk successfully.');

    // Build the persistent public URL
    const baseUrl = process.env.BACKEND_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const photoUrl = `${baseUrl}/uploads/evidence/${filename}`;

    console.log('[upload-photo] ✓ Persistent URL:', photoUrl);

    res.status(201).json({
      success: true,
      message: 'Evidence photo uploaded successfully.',
      data: { photoUrl },
    });

    console.log('[upload-photo] ✓ Response sent. Done.\n');
  } catch (err: any) {
    console.error('[upload-photo] ✗ Unexpected error:', err.message || err);
    res.status(500).json({ success: false, message: err?.message || 'Photo upload failed.' });
  }
};

/**
 * GET /api/mobile/conflicts/ranger-assigned/:rangerId?
 * Retrieve all conflict reports assigned to a specific ranger
 */
export const getRangerAssignedReports = async (req: Request, res: Response) => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    const rangerParam = req.params.rangerId || (req.query.rangerId as string);
    const rangerId = rangerParam || authUser?.id || authUser?.officerId || '';
    const rangerName = (req.query.rangerName as string) || authUser?.name || '';

    const orClauses: any[] = [];
    if (rangerId && rangerId !== 'undefined' && rangerId !== 'null') {
      orClauses.push({ assignedRangerId: rangerId });
    }
    if (authUser?.officerId && authUser.officerId !== rangerId) {
      orClauses.push({ assignedRangerId: authUser.officerId });
    }
    if (rangerName && rangerName !== 'undefined' && rangerName !== 'null') {
      orClauses.push({ assignedRangerName: new RegExp(rangerName, 'i') });
      orClauses.push({ actionTaken: new RegExp(rangerName, 'i') });
    }

    const filter = orClauses.length > 0 
      ? { $or: orClauses } 
      : { assignedRangerId: { $exists: true, $ne: '' } };

    const reports = await CommunityReport.find(filter)
      .sort({ dispatchedAt: -1, reportedAt: -1 })
      .lean();

    res.json({
      success: true,
      reports,
      data: reports,
      total: reports.length,
    });
  } catch (err: any) {
    console.error('Error fetching ranger assigned reports:', err);
    res.status(500).json({ success: false, message: 'Server error fetching assigned reports' });
  }
};

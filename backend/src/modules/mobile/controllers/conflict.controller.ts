import { Request, Response } from 'express';
import { CommunityReport } from '../../../models/CommunityReport.model.js';
import { User } from '../../../models/User.model.js';
import { AuthenticatedRequest } from '../../../middlewares/auth.middleware.js';

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
      status = 'Pending Verification',
      search,
      severity,
      animal,
      park,
      sort = 'newest',
      limit = '50',
    } = req.query as Record<string, string>;

    const filter: any = {};

    // Status - support comma-separated list
    const statuses = status.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      filter.status = statuses[0];
    } else if (statuses.length > 1) {
      filter.status = { $in: statuses };
    }

    // Optional field filters
    if (severity) filter.severity = severity;
    if (animal) filter.animalSpecies = animal;
    if (park) filter.park = park;

    // Text search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { reportId: regex },
        { locationName: regex },
        { animalSpecies: regex },
        { conflictType: regex },
        { description: regex },
        { reporterName: regex },
      ];
    }

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
    } catch(e) {
      // Invalid ObjectId format
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
    report.assignedRangerId = rangerId;
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


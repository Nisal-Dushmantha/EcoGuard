import {
  verifyConflictReport,
  rejectConflictReport,
  dispatchConflictReport,
  updateConflictStatus,
} from '../../modules/mobile/controllers/conflict.controller.js';
import { CommunityReport } from '../../models/CommunityReport.model.js';
import { User } from '../../models/User.model.js';

jest.mock('../../models/CommunityReport.model.js');
jest.mock('../../models/User.model.js');

describe('UC03 - Backend Conflict Status Transition Unit Tests', () => {
  let req: any;
  let res: any;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { reportId: 'CR-2026-1004' },
      body: {},
      user: { id: 'clo-01', role: 'Community Liaison Officer', name: 'Officer Wickramasinghe' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ── 1. VERIFY LOGIC ────────────────────────────────────────────────────────
  describe('1. Verify Logic (verifyConflictReport)', () => {
    it('1.1 Positive: PENDING -> VERIFIED succeeds and sets metadata', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Pending Verification',
        actionTaken: '',
        verifiedBy: '',
        verifiedAt: undefined,
        save: jest.fn().mockResolvedValue(true),
        toObject: function () { return this; },
      };

      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.body = { verifiedBy: 'CLO Officer Jayasinghe' };

      await verifyConflictReport(req, res);

      expect(mockReport.status).toBe('Verified');
      expect(mockReport.verifiedBy).toBe('CLO Officer Jayasinghe');
      expect(mockReport.verifiedAt).toBeInstanceOf(Date);
      expect(mockReport.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Report verified successfully.',
        })
      );
    });

    it('1.2 Negative: verifying an already VERIFIED report fails with 400', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Verified',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      await verifyConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/only pending verification reports can be verified/i),
        })
      );
    });

    it('1.3 Negative: verifying a REJECTED report fails with 400', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Rejected',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      await verifyConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('1.4 Error case: missing report handled with 404', async () => {
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(null);

      await verifyConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Report not found',
        })
      );
    });

    it('1.5 Error case: catch block handles server errors', async () => {
      (CommunityReport.findOne as jest.Mock).mockRejectedValue(new Error('DB Query Failed'));

      await verifyConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
      });
    });
  });

  // ── 2. REJECT LOGIC ────────────────────────────────────────────────────────
  describe('2. Reject Logic (rejectConflictReport)', () => {
    it('2.1 Positive: PENDING -> REJECTED succeeds with reason stored', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Pending Verification',
        rejectionReason: '',
        save: jest.fn().mockResolvedValue(true),
        toObject: function () { return this; },
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.body = { reason: 'Duplicate entry submitted.' };

      await rejectConflictReport(req, res);

      expect(mockReport.status).toBe('Rejected');
      expect(mockReport.rejectionReason).toBe('Duplicate entry submitted.');
      expect(mockReport.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Report rejected.',
        })
      );
    });

    it('2.2 Negative: rejecting without a reason fails with 400', async () => {
      req.body = { reason: '' };

      await rejectConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Rejection reason is required.',
        })
      );
    });

    it('2.3 Negative: rejecting an already processed report (DISPATCHED) fails with 400', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Dispatched',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);
      req.body = { reason: 'No longer needed' };

      await rejectConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/only pending verification reports can be rejected/i),
        })
      );
    });

    it('2.4 Error case: missing report handled with 404', async () => {
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(null);
      req.body = { reason: 'Valid reason' };

      await rejectConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('2.5 Error case: catch block handles server errors', async () => {
      req.body = { reason: 'Valid reason' };
      (CommunityReport.findOne as jest.Mock).mockRejectedValue(new Error('DB Failure'));

      await rejectConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── 3. DISPATCH LOGIC ──────────────────────────────────────────────────────
  describe('3. Dispatch Logic (dispatchConflictReport)', () => {
    it('3.1 Positive: VERIFIED -> DISPATCHED succeeds and assigns ranger', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Verified',
        assignedRangerId: '',
        assignedRangerName: '',
        dispatchedBy: '',
        dispatchedAt: undefined,
        officerNotes: '',
        actionTaken: '',
        save: jest.fn().mockResolvedValue(true),
        toObject: function () { return this; },
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      const mockRanger: any = {
        _id: 'ranger-obj-555',
        name: 'Ranger K. Bandara',
        role: 'Ranger',
      };
      (User.findById as jest.Mock).mockResolvedValue(mockRanger);

      req.body = {
        rangerId: 'ranger-obj-555',
        notes: 'Proceed with elephant deterrent equipment.',
        dispatchedBy: 'CLO Officer Perera',
      };

      await dispatchConflictReport(req, res);

      expect(mockReport.status).toBe('Dispatched');
      expect(mockReport.assignedRangerId).toBe('ranger-obj-555');
      expect(mockReport.assignedRangerName).toBe('Ranger K. Bandara');
      expect(mockReport.dispatchedBy).toBe('CLO Officer Perera');
      expect(mockReport.dispatchedAt).toBeInstanceOf(Date);
      expect(mockReport.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Ranger dispatched successfully.',
        })
      );
    });

    it('3.2 Negative: missing rangerId fails with 400', async () => {
      req.body = {};

      await dispatchConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ranger ID is required.',
        })
      );
    });

    it('3.3 Negative: PENDING report cannot be dispatched', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Pending Verification',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.body = { rangerId: 'ranger-obj-555' };

      await dispatchConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/only verified reports can be dispatched/i),
        })
      );
    });

    it('3.4 Negative: duplicate dispatch on already DISPATCHED report fails with 400', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Dispatched',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.body = { rangerId: 'ranger-obj-555' };

      await dispatchConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'This report has already been dispatched.',
        })
      );
    });

    it('3.5 Negative: invalid or non-existent ranger rejected with 404', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Verified',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);
      (User.findById as jest.Mock).mockRejectedValue(new Error('Invalid ObjectId'));
      (User.findOne as jest.Mock).mockResolvedValue(null);

      req.body = { rangerId: 'invalid-ranger-999' };

      await dispatchConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Selected ranger not found.',
        })
      );
    });

    it('3.6 Negative: non-Ranger role user rejected for dispatch', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Verified',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      const mockUser: any = {
        _id: 'user-admin-01',
        name: 'Admin User',
        role: 'Community Member', // Not Ranger
      };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      req.body = { rangerId: 'user-admin-01' };

      await dispatchConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Selected user is not a Ranger.',
        })
      );
    });

    it('3.7 Error case: handles server error during dispatch', async () => {
      req.body = { rangerId: 'r-1' };
      (CommunityReport.findOne as jest.Mock).mockRejectedValue(new Error('DB Timeout'));

      await dispatchConflictReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── 4. RANGER RESPONSE LOGIC ─────────────────────────────────────────────
  describe('4. Ranger Response Logic (updateConflictStatus)', () => {
    it('4.1 Negative: unauthenticated request returns 401', async () => {
      req.user = undefined;

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('4.2 Negative: Community Liaison Officer forbidden from field status updates', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Dispatched',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'clo-01', role: 'Community Liaison Officer', name: 'CLO Officer' };
      req.body = { status: 'In Progress' };

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/forbidden: community liaison officers cannot mark reports as in progress or resolved/i),
        })
      );
    });

    it('4.3 Negative: unassigned Ranger gets forbidden (403)', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Dispatched',
        assignedRangerId: 'ranger-111',
        assignedRangerName: 'Ranger Bandara',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'ranger-999', role: 'Ranger', name: 'Ranger Other' };
      req.body = { status: 'In Progress' };

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Forbidden: You are not assigned to this conflict report.',
        })
      );
    });

    it('4.4 Positive: matches assigned ranger via officerId or assignedRangerName', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Dispatched',
        assignedRangerId: 'OFFICER-777',
        assignedRangerName: 'Ranger Perera',
        inProgressAt: undefined,
        officerNotes: '',
        save: jest.fn().mockResolvedValue(true),
        toObject: function () { return this; },
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'usr-999', officerId: 'OFFICER-777', role: 'Ranger', name: 'Ranger Perera' };
      req.body = { status: 'In Progress', note: 'En route.' };

      await updateConflictStatus(req, res);

      expect(mockReport.status).toBe('In Progress');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('4.5 Negative: user role other than Ranger or Officer rejected (403)', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Dispatched',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'guest-1', role: 'Guest' };
      req.body = { status: 'In Progress' };

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Forbidden: Only the assigned Ranger can update response status or resolve conflict reports.',
        })
      );
    });

    it('4.6 Negative: setting In Progress when status is not Dispatched fails with 400', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Pending Verification',
        assignedRangerId: 'ranger-111',
        assignedRangerName: 'Ranger Bandara',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'ranger-111', role: 'Ranger', name: 'Ranger Bandara' };
      req.body = { status: 'In Progress' };

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/report must be dispatched/i),
        })
      );
    });

    it('4.7 Positive: DISPATCHED -> IN_PROGRESS succeeds for assigned Ranger', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Dispatched',
        assignedRangerId: 'ranger-111',
        assignedRangerName: 'Ranger Bandara',
        inProgressAt: undefined,
        officerNotes: '',
        save: jest.fn().mockResolvedValue(true),
        toObject: function () { return this; },
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'ranger-111', role: 'Ranger', name: 'Ranger Bandara' };
      req.body = { status: 'In Progress', note: 'Arrived at village border.' };

      await updateConflictStatus(req, res);

      expect(mockReport.status).toBe('In Progress');
      expect(mockReport.inProgressAt).toBeInstanceOf(Date);
      expect(mockReport.officerNotes).toMatch(/Arrived at village border/);
      expect(mockReport.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Status updated to In Progress.',
        })
      );
    });

    it('4.8 Negative: invalid direct transition DISPATCHED -> RESOLVED rejected with 400', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Dispatched',
        assignedRangerId: 'ranger-111',
        assignedRangerName: 'Ranger Bandara',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'ranger-111', role: 'Ranger', name: 'Ranger Bandara' };
      req.body = { status: 'Resolved', resolutionNote: 'Done' };

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid status transition. Report must be set to "In Progress" before it can be resolved.',
        })
      );
    });

    it('4.9 Negative: trying to resolve a report with status Pending Verification fails with 400', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Pending Verification',
        assignedRangerId: 'ranger-111',
        assignedRangerName: 'Ranger Bandara',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'ranger-111', role: 'Ranger', name: 'Ranger Bandara' };
      req.body = { status: 'Resolved', resolutionNote: 'Resolved' };

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/report must be in progress before resolving/i),
        })
      );
    });

    it('4.10 Positive: IN_PROGRESS -> RESOLVED succeeds for assigned Ranger when resolution note provided', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'In Progress',
        assignedRangerId: 'ranger-111',
        assignedRangerName: 'Ranger Bandara',
        resolvedAt: undefined,
        resolvedBy: '',
        resolutionNote: '',
        officerNotes: '[In Progress]: En route',
        save: jest.fn().mockResolvedValue(true),
        toObject: function () { return this; },
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'ranger-111', role: 'Ranger', name: 'Ranger Bandara' };
      req.body = { status: 'Resolved', resolutionNote: 'Herd guided back into sanctuary.' };

      await updateConflictStatus(req, res);

      expect(mockReport.status).toBe('Resolved');
      expect(mockReport.resolvedAt).toBeInstanceOf(Date);
      expect(mockReport.resolvedBy).toBe('Ranger Bandara');
      expect(mockReport.resolutionNote).toBe('Herd guided back into sanctuary.');
      expect(mockReport.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Status updated to Resolved.',
        })
      );
    });

    it('4.11 Negative: IN_PROGRESS -> RESOLVED with empty resolutionNotes fails with 400', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'In Progress',
        assignedRangerId: 'ranger-111',
        assignedRangerName: 'Ranger Bandara',
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'ranger-111', role: 'Ranger', name: 'Ranger Bandara' };
      req.body = { status: 'Resolved', resolutionNote: '   ' };

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Resolution notes are required to resolve a conflict report.',
        })
      );
    });

    it('4.12 Negative: missing report returns 404', async () => {
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(null);

      req.user = { id: 'ranger-111', role: 'Ranger', name: 'Ranger Bandara' };
      req.body = { status: 'In Progress' };

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('4.13 Error case: handles server error during status update', async () => {
      const mockReport: any = {
        reportId: 'CR-2026-1004',
        status: 'Dispatched',
        assignedRangerId: 'ranger-111',
        assignedRangerName: 'Ranger Bandara',
        save: jest.fn().mockRejectedValue(new Error('Disk write failure')),
      };
      (CommunityReport.findOne as jest.Mock).mockResolvedValue(mockReport);

      req.user = { id: 'ranger-111', role: 'Ranger', name: 'Ranger Bandara' };
      req.body = { status: 'In Progress' };

      await updateConflictStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Server error updating status',
        })
      );
    });
  });
});

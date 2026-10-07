import {
  getConflictReports,
  getConflictReportById,
  getDashboardSummary,
  getCommunityMemberDashboard,
  uploadEvidencePhoto,
  getRangerAssignedReports,
} from '../../modules/mobile/controllers/conflict.controller.js';
import { CommunityReport } from '../../models/CommunityReport.model.js';
import { User } from '../../models/User.model.js';
import fs from 'fs';

jest.mock('../../models/CommunityReport.model.js');
jest.mock('../../models/User.model.js');
jest.mock('fs');

describe('UC03 - Backend Conflict Controller & Services Unit Tests', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {},
      params: {},
      body: {},
      headers: {},
      user: { id: 'usr-100', role: 'Community Liaison Officer', name: 'Officer Bandara' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ── 1. GET CONFLICT REPORTS QUERYING & FILTERING ────────────────────────────
  describe('1. getConflictReports Query Filtering', () => {
    it('1.1 Positive: filters by status and returns paginated list', async () => {
      req.query = { status: 'Pending Verification', limit: '10' };

      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { reportId: 'CR-101', status: 'Pending Verification', severity: 'High', reportedAt: new Date() },
        ]),
      };

      (CommunityReport.find as jest.Mock).mockReturnValue(mockQueryChain);
      (CommunityReport.countDocuments as jest.Mock).mockResolvedValue(1);

      await getConflictReports(req, res);

      expect(CommunityReport.find).toHaveBeenCalledWith({ $and: [{ status: 'Pending Verification' }] });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            reports: expect.arrayContaining([expect.objectContaining({ reportId: 'CR-101' })]),
            total: 1,
          },
        })
      );
    });

    it('1.2 Positive: filters by comma-separated status list', async () => {
      req.query = { status: 'Pending Verification, Verified' };

      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (CommunityReport.find as jest.Mock).mockReturnValue(mockQueryChain);
      (CommunityReport.countDocuments as jest.Mock).mockResolvedValue(0);

      await getConflictReports(req, res);

      expect(CommunityReport.find).toHaveBeenCalledWith({
        $and: [{ status: { $in: ['Pending Verification', 'Verified'] } }],
      });
    });

    it('1.3 Positive: filters by reporterId, assignedRangerId=any, severity, animal, park', async () => {
      req.query = {
        reporterId: 'rep-123',
        assignedRangerId: 'any',
        severity: 'High',
        animal: 'Asian Elephant',
        park: 'Yala National Park',
        sort: 'oldest',
      };
      req.user = { id: 'rep-123', name: 'John Doe' };

      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (CommunityReport.find as jest.Mock).mockReturnValue(mockQueryChain);
      (CommunityReport.countDocuments as jest.Mock).mockResolvedValue(0);

      await getConflictReports(req, res);

      expect(CommunityReport.find).toHaveBeenCalledWith({
        $and: expect.arrayContaining([
          { severity: 'High' },
          { animalSpecies: 'Asian Elephant' },
          { park: 'Yala National Park' },
          { assignedRangerId: { $exists: true, $ne: '' } },
        ]),
      });
    });

    it('1.4 Positive: filters by assignedRangerId specific id', async () => {
      req.query = { assignedRangerId: 'ranger-99' };

      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (CommunityReport.find as jest.Mock).mockReturnValue(mockQueryChain);
      (CommunityReport.countDocuments as jest.Mock).mockResolvedValue(0);

      await getConflictReports(req, res);

      expect(CommunityReport.find).toHaveBeenCalledWith({
        $and: expect.arrayContaining([
          expect.objectContaining({
            $or: expect.arrayContaining([{ assignedRangerId: 'ranger-99' }]),
          }),
        ]),
      });
    });

    it('1.5 Positive: filters by search term across multiple fields', async () => {
      req.query = { search: 'elephant' };

      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ reportId: 'CR-102', conflictType: 'Crop Raiding' }]),
      };

      (CommunityReport.find as jest.Mock).mockReturnValue(mockQueryChain);
      (CommunityReport.countDocuments as jest.Mock).mockResolvedValue(1);

      await getConflictReports(req, res);

      expect(CommunityReport.find).toHaveBeenCalledWith({
        $and: [
          expect.objectContaining({
            $or: expect.arrayContaining([
              { reportId: expect.any(RegExp) },
              { locationName: expect.any(RegExp) },
              { animalSpecies: expect.any(RegExp) },
            ]),
          }),
        ],
      });
    });

    it('1.6 Positive: sorts reports by severity ranking', async () => {
      req.query = { sort: 'severity' };

      const mockReports = [
        { reportId: 'CR-LOW', severity: 'Low', reportedAt: new Date() },
        { reportId: 'CR-CRIT', severity: 'Critical', reportedAt: new Date() },
        { reportId: 'CR-MED', severity: 'Medium', reportedAt: new Date() },
      ];

      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReports),
      };

      (CommunityReport.find as jest.Mock).mockReturnValue(mockQueryChain);
      (CommunityReport.countDocuments as jest.Mock).mockResolvedValue(3);

      await getConflictReports(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reports: [
            expect.objectContaining({ reportId: 'CR-CRIT' }),
            expect.objectContaining({ reportId: 'CR-MED' }),
            expect.objectContaining({ reportId: 'CR-LOW' }),
          ],
          total: 3,
        },
      });
    });

    it('1.7 Error case: handles query server errors', async () => {
      (CommunityReport.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await getConflictReports(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
      });
    });
  });

  // ── 2. GET CONFLICT REPORT BY ID ───────────────────────────────────────────
  describe('2. getConflictReportById', () => {
    it('2.1 Positive: returns report details when report exists', async () => {
      req.params = { reportId: 'CR-2026-1004' };
      const mockReport = { reportId: 'CR-2026-1004', conflictType: 'Crop Raiding' };

      (CommunityReport.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReport),
      });

      await getConflictReportById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReport,
      });
    });

    it('2.2 Negative: returns 404 when report not found', async () => {
      req.params = { reportId: 'NON-EXISTENT-ID' };

      (CommunityReport.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await getConflictReportById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Report not found',
      });
    });

    it('2.3 Error case: handles error in getConflictReportById', async () => {
      req.params = { reportId: 'CR-ERR' };
      (CommunityReport.findOne as jest.Mock).mockImplementation(() => {
        throw new Error('DB Read Error');
      });

      await getConflictReportById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── 3. DASHBOARD SUMMARIES ──────────────────────────────────────────────────
  describe('3. Dashboard Summaries', () => {
    it('3.1 Positive: getDashboardSummary returns summary for CLO', async () => {
      req.user = { id: 'officer-1' };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: 'officer-1',
            name: 'Officer Silva',
            role: 'Community Liaison Officer',
            assignedPark: 'Yala National Park',
          }),
        }),
      });

      (CommunityReport.countDocuments as jest.Mock)
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(3) // verified
        .mockResolvedValueOnce(2); // dispatched

      const mockNeedsAttention = [
        { reportId: 'CR-1', severity: 'Critical', reportedAt: new Date() },
        { reportId: 'CR-2', severity: 'Low', reportedAt: new Date() },
      ];

      (CommunityReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockNeedsAttention),
          }),
        }),
      });

      await getDashboardSummary(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            stats: { pending: 5, verified: 3, dispatched: 2 },
          }),
        })
      );
    });

    it('3.2 Negative: getDashboardSummary handles unauthorized user (401)', async () => {
      req.user = undefined;

      await getDashboardSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('3.3 Negative: getDashboardSummary handles missing officer (404)', async () => {
      req.user = { id: 'missing-officer' };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await getDashboardSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Officer not found',
      });
    });

    it('3.4 Error case: getDashboardSummary handles server errors', async () => {
      req.user = { id: 'officer-1' };
      (User.findById as jest.Mock).mockImplementation(() => {
        throw new Error('Database Error');
      });

      await getDashboardSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('3.5 Positive: getCommunityMemberDashboard returns member dashboard stats', async () => {
      req.user = { id: 'member-99', name: 'Sunil Member' };

      (CommunityReport.countDocuments as jest.Mock)
        .mockResolvedValueOnce(4) // total
        .mockResolvedValueOnce(2) // pending
        .mockResolvedValueOnce(1) // inProgress
        .mockResolvedValueOnce(1); // resolved

      (CommunityReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await getCommunityMemberDashboard(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          stats: {
            myReports: 4,
            pending: 2,
            inProgress: 1,
            resolved: 1,
          },
        }),
      });
    });

    it('3.6 Error case: getCommunityMemberDashboard handles server error', async () => {
      req.user = { id: 'member-99' };
      (CommunityReport.countDocuments as jest.Mock).mockRejectedValue(new Error('Member DB Error'));

      await getCommunityMemberDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── 4. EVIDENCE PHOTO UPLOAD ────────────────────────────────────────────────
  describe('4. Evidence Photo Upload (uploadEvidencePhoto)', () => {
    it('4.1 Negative: returns 400 when no file or buffer is present', async () => {
      req.file = undefined;
      req.headers = { 'content-type': 'multipart/form-data' };

      await uploadEvidencePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/no photo received/i),
        })
      );
    });

    it('4.2 Positive: writes file buffer to disk and returns 201 with persistent photoUrl', async () => {
      req.file = {
        fieldname: 'photo',
        originalname: 'conflict_evidence.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('mock-image-data'),
      };
      req.headers = { 'content-type': 'multipart/form-data' };
      req.protocol = 'http';
      req.get = jest.fn().mockReturnValue('localhost:5000');

      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      await uploadEvidencePhoto(req, res);

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Evidence photo uploaded successfully.',
        data: {
          photoUrl: expect.stringMatching(/http:\/\/localhost:5000\/uploads\/evidence\/evidence-/),
        },
      });
    });

    it('4.3 Error case: handles file write error (500)', async () => {
      req.file = {
        fieldname: 'photo',
        originalname: 'test.png',
        buffer: Buffer.from('data'),
      };
      req.headers = { 'content-type': 'multipart/form-data' };
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied writing to disk');
      });

      await uploadEvidencePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Permission denied writing to disk',
      });
    });
  });

  // ── 5. RANGER ASSIGNED REPORTS ─────────────────────────────────────────────
  describe('5. Ranger Assigned Reports (getRangerAssignedReports)', () => {
    it('5.1 Positive: retrieves reports assigned to specific ranger by id, officerId or rangerName', async () => {
      req.params = { rangerId: 'ranger-101' };
      req.query = { rangerName: 'Ranger Bandara' };
      req.user = { id: 'ranger-101', officerId: 'OFFICER-55', name: 'Ranger Bandara' };

      const mockReports = [
        { reportId: 'CR-ASSIGNED-1', assignedRangerId: 'ranger-101' },
      ];

      (CommunityReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockReports),
        }),
      });

      await getRangerAssignedReports(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        reports: mockReports,
        data: mockReports,
        total: 1,
      });
    });

    it('5.2 Error case: getRangerAssignedReports handles server error', async () => {
      req.params = { rangerId: 'r-1' };
      (CommunityReport.find as jest.Mock).mockImplementation(() => {
        throw new Error('Ranger fetch error');
      });

      await getRangerAssignedReports(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

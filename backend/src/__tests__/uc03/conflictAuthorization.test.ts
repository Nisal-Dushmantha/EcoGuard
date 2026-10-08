import { Request, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { getRangerAssignedReports } from '../../modules/mobile/controllers/conflict.controller.js';
import { CommunityReport } from '../../models/CommunityReport.model.js';

jest.mock('../../models/CommunityReport.model.js');
jest.mock('../../models/User.model.js');

describe('UC03 - Backend Authorization & Security Unit Tests', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {},
      params: {},
      body: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  // ── 1. PROTECT CONFLICT REPORT GET ROUTES (authenticateToken) ───────────────
  describe('1. Route Authentication Guard (authenticateToken)', () => {
    it('1.1 Negative: unauthenticated GET /reports returns 401 Unauthorized', () => {
      req.headers = {}; // No Authorization header

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Access denied. No token provided.',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('1.2 Negative: unauthenticated GET /reports/:reportId returns 401 Unauthorized', () => {
      req.headers = { authorization: '' }; // Invalid header format

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Access denied. No token provided.',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ── 2. RESTRICT OFFICER MANAGEMENT ENDPOINTS (requireRole) ─────────────────
  describe('2. Officer Management Role Enforcement (requireRole)', () => {
    const cloRoleGuard = requireRole(['Community Liaison Officer']);

    it('2.1 Positive: Community Liaison Officer role allowed to proceed', () => {
      req.user = { id: 'clo-01', role: 'Community Liaison Officer', name: 'Officer Bandara' };

      cloRoleGuard(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('2.2 Negative: Community Member blocked with 403 Forbidden for verify/reject/dispatch', () => {
      req.user = { id: 'mem-01', role: 'Community Member', name: 'Sunil Perera' };

      cloRoleGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/access forbidden/i),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('2.3 Negative: Ranger blocked with 403 Forbidden for verify/reject/dispatch', () => {
      req.user = { id: 'ran-01', role: 'Ranger', name: 'Ranger Jayasinghe' };

      cloRoleGuard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/access forbidden/i),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ── 3. RANGER ASSIGNMENT AUTHORIZATION (getRangerAssignedReports) ─────────
  describe('3. Ranger Assignment Data Leak Safeguard (getRangerAssignedReports)', () => {
    it('3.1 Positive: Ranger requests own assigned reports successfully', async () => {
      req.user = { id: 'ranger-101', role: 'Ranger', name: 'Ranger Bandara' };

      const mockReports = [
        { reportId: 'CR-101', assignedRangerId: 'ranger-101', status: 'Dispatched' },
      ];

      (CommunityReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockReports),
        }),
      });

      await getRangerAssignedReports(req, res);

      expect(CommunityReport.find).toHaveBeenCalledWith({
        $or: expect.arrayContaining([
          { assignedRangerId: 'ranger-101' },
        ]),
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          reports: mockReports,
          total: 1,
        })
      );
    });

    it('3.2 Negative: Ranger supplying another rangerId in query is IGNORED and assigned strictly to authenticated user', async () => {
      req.user = { id: 'ranger-101', role: 'Ranger', name: 'Ranger Bandara' };
      req.query = { rangerId: 'OTHER_RANGER_999' }; // Malicious attempt to leak other ranger's data
      req.params = { rangerId: 'OTHER_RANGER_999' };

      (CommunityReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      await getRangerAssignedReports(req, res);

      // Verify CommunityReport.find was called with ranger-101, NOT OTHER_RANGER_999
      const queryFilter = (CommunityReport.find as jest.Mock).mock.calls[0][0];
      expect(JSON.stringify(queryFilter)).not.toContain('OTHER_RANGER_999');
      expect(JSON.stringify(queryFilter)).toContain('ranger-101');
    });

    it('3.3 Positive: Officer can query specific rangerId assignments', async () => {
      req.user = { id: 'clo-01', role: 'Community Liaison Officer', name: 'Officer Fernando' };
      req.query = { rangerId: 'ranger-555' };

      (CommunityReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      await getRangerAssignedReports(req, res);

      expect(CommunityReport.find).toHaveBeenCalledWith({
        $or: expect.arrayContaining([{ assignedRangerId: 'ranger-555' }]),
      });
    });
  });
});

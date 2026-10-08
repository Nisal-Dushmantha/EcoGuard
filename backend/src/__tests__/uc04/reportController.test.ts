import { Request, Response } from 'express';
import {
  getParks,
  getAnalyticsSummary,
  generateReport,
  getReports,
  getReportById,
} from '../../modules/webapp/controllers/report.controller.js';
import { ReportService } from '../../modules/webapp/services/report.service.js';

jest.mock('../../modules/webapp/services/report.service.js');

describe('UC04 - ReportController Unit Tests', () => {
  let req: any;
  let res: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'mgr-01', name: 'Park Manager Silva', role: 'Park Manager' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ── 1. GET PARKS CONTROLLER ──────────────────────────────────────────────────
  describe('1. getParks', () => {
    it('1.1 Positive: returns 200 with list of parks', () => {
      const mockParks = [{ id: 'yala', name: 'Yala National Park', sectors: ['Sector 1'] }];
      (ReportService.getParks as jest.Mock).mockReturnValue(mockParks);

      getParks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        parks: mockParks,
      });
    });

    it('1.2 Error case: returns 500 when service throws an exception', () => {
      (ReportService.getParks as jest.Mock).mockImplementation(() => {
        throw new Error('Config read failure');
      });

      getParks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Config read failure',
      });
    });
  });

  // ── 2. GET ANALYTICS SUMMARY CONTROLLER ──────────────────────────────────────
  describe('2. getAnalyticsSummary', () => {
    it('2.1 Positive: returns 200 with dashboard summary metrics', async () => {
      req.query = { park: 'Yala National Park' };
      const mockData = { totalIncidents: 10, totalPatrols: 5, totalConflicts: 3 };
      (ReportService.getAnalyticsSummary as jest.Mock).mockResolvedValue(mockData);

      await getAnalyticsSummary(req, res);

      expect(ReportService.getAnalyticsSummary).toHaveBeenCalledWith('Yala National Park');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });

    it('2.2 Error case: returns 500 when database aggregation fails', async () => {
      (ReportService.getAnalyticsSummary as jest.Mock).mockRejectedValue(new Error('DB Aggregation error'));

      await getAnalyticsSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'DB Aggregation error',
      });
    });
  });

  // ── 3. GENERATE REPORT CONTROLLER ─────────────────────────────────────────────
  describe('3. generateReport', () => {
    it('3.1 Positive: returns 200 with report payload when valid criteria is passed', async () => {
      req.body = {
        park: 'Yala National Park',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        location: 'All Areas',
        sections: ['incidentStatistics'],
      };

      const mockResult = {
        noData: false,
        reportId: 'CR-100200',
        park: 'Yala National Park',
        summary: { totalIncidents: 5 },
      };

      (ReportService.generateReport as jest.Mock).mockResolvedValue(mockResult);

      await generateReport(req, res);

      expect(ReportService.generateReport).toHaveBeenCalledWith(
        req.body,
        expect.objectContaining({ name: 'Park Manager Silva' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });

    it('3.2 Negative: returns 400 when validation fails with date or section error', async () => {
      req.body = {
        park: 'Yala National Park',
        startDate: '2026-02-01',
        endDate: '2026-01-01',
        sections: ['incidentStatistics'],
      };

      (ReportService.generateReport as jest.Mock).mockRejectedValue(
        new Error('Invalid date range: End date cannot be before start date.')
      );

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid date range: End date cannot be before start date.',
      });
    });

    it('3.3 Error case: returns 500 when unexpected server error occurs', async () => {
      req.body = {
        park: 'Yala National Park',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        sections: ['incidentStatistics'],
      };

      (ReportService.generateReport as jest.Mock).mockRejectedValue(
        new Error('Unexpected disk save crash')
      );

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unexpected disk save crash',
      });
    });
  });

  // ── 4. GET REPORTS CONTROLLER ─────────────────────────────────────────────────
  describe('4. getReports', () => {
    it('4.1 Positive: returns 200 with historical reports list', async () => {
      req.query = { park: 'Yala National Park' };
      const mockReports = [{ reportId: 'CR-1' }, { reportId: 'CR-2' }];
      (ReportService.getReports as jest.Mock).mockResolvedValue(mockReports);

      await getReports(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        reports: mockReports,
      });
    });

    it('4.2 Error case: returns 500 when error fetching historical reports', async () => {
      (ReportService.getReports as jest.Mock).mockRejectedValue(new Error('Read error'));

      await getReports(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Read error',
      });
    });
  });

  // ── 5. GET REPORT BY ID CONTROLLER ─────────────────────────────────────────────
  describe('5. getReportById', () => {
    it('5.1 Positive: returns 200 with report details when report exists', async () => {
      req.params = { id: 'CR-1004' };
      const mockReport = { reportId: 'CR-1004', park: 'Yala National Park' };
      (ReportService.getReportById as jest.Mock).mockResolvedValue(mockReport);

      await getReportById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        report: mockReport,
      });
    });

    it('5.2 Negative: returns 404 when report is not found', async () => {
      req.params = { id: 'NON-EXISTENT' };
      (ReportService.getReportById as jest.Mock).mockResolvedValue(null);

      await getReportById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Report not found.',
      });
    });

    it('5.3 Error case: returns 500 when exception occurs', async () => {
      req.params = { id: 'ERR-ID' };
      (ReportService.getReportById as jest.Mock).mockRejectedValue(new Error('Fetch crash'));

      await getReportById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Fetch crash',
      });
    });
  });
});

import mongoose from 'mongoose';
import { ReportService } from '../../modules/webapp/services/report.service.js';
import { Incident } from '../../models/Incident.model.js';
import { Patrol } from '../../models/Patrol.model.js';
import { CommunityReport } from '../../models/CommunityReport.model.js';
import { ConservationReport } from '../../models/ConservationReport.model.js';
import { PARKS_CONFIG } from '../../config/parks.config.js';

jest.mock('../../models/Incident.model.js');
jest.mock('../../models/Patrol.model.js');
jest.mock('../../models/CommunityReport.model.js');
jest.mock('../../models/ConservationReport.model.js');

describe('UC04 - ReportService Unit Tests', () => {
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

  const mockUser = {
    id: 'mgr-001',
    name: 'Park Manager Silva',
    role: 'Park Manager',
  };

  const setDbConnectionState = (state: number) => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      get: () => state,
      configurable: true,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setDbConnectionState(1); // Simulate connected database by default

    // Mock ConservationReport constructor to return data object with save function
    (ConservationReport as unknown as jest.Mock).mockImplementation((data: any) => ({
      ...data,
      save: jest.fn().mockResolvedValue(true),
    }));
  });

  // ── 1. GET PARKS ────────────────────────────────────────────────────────────
  describe('1. getParks', () => {
    it('1.1 Positive: returns configured list of national parks', () => {
      const parks = ReportService.getParks();
      expect(parks).toEqual(PARKS_CONFIG);
      expect(parks.length).toBeGreaterThan(0);
      expect(parks[0]).toHaveProperty('name');
    });
  });

  // ── 2. GET ANALYTICS SUMMARY ────────────────────────────────────────────────
  describe('2. getAnalyticsSummary', () => {
    it('2.1 Positive: aggregates summary metrics when database is connected', async () => {
      (Incident.countDocuments as jest.Mock).mockResolvedValue(12);
      (Incident.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ _id: 'Poaching', count: 8 }, { _id: 'Encroachment', count: 4 }])
        .mockResolvedValueOnce([{ _id: 'Mahasenpura Village', incidentCount: 5 }]);

      (Patrol.countDocuments as jest.Mock).mockResolvedValue(15);
      (Patrol.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ _id: null, totalDistance: 145.5 }])
        .mockResolvedValueOnce([{ _id: 'Sector 4', count: 10, totalKm: 100 }]);

      (CommunityReport.countDocuments as jest.Mock).mockResolvedValue(8);
      (CommunityReport.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ _id: 'Asian Elephant', count: 6 }, { _id: 'Wild Boar', count: 2 }])
        .mockResolvedValueOnce([{ _id: 'High', count: 5 }, { _id: 'Medium', count: 3 }])
        .mockResolvedValueOnce([{ _id: 'Mahasenpura Village', conflictCount: 4 }]);

      const summary = await ReportService.getAnalyticsSummary('Yala National Park');

      expect(summary.dbConnected).toBe(true);
      expect(summary.totalIncidents).toBe(12);
      expect(summary.totalPatrols).toBe(15);
      expect(summary.patrolDistanceKm).toBe(145.5);
      expect(summary.totalConflicts).toBe(8);
      expect(summary.incidentsByType).toEqual([
        { type: 'Poaching', count: 8 },
        { type: 'Encroachment', count: 4 },
      ]);
      expect(summary.conflictsBySpecies).toEqual([
        { species: 'Asian Elephant', count: 6 },
        { species: 'Wild Boar', count: 2 },
      ]);
    });

    it('2.2 Edge case: handles database disconnection gracefully', async () => {
      setDbConnectionState(0);

      const summary = await ReportService.getAnalyticsSummary('All Parks');

      expect(summary.dbConnected).toBe(false);
      expect(summary.totalIncidents).toBe(0);
      expect(summary.totalPatrols).toBe(0);
      expect(summary.totalConflicts).toBe(0);
      expect(summary.highRiskAreas).toEqual([]);
    });

    it('2.3 Positive: supports specific park filters other than Yala or All Parks', async () => {
      (Incident.countDocuments as jest.Mock).mockResolvedValue(3);
      (Incident.aggregate as jest.Mock).mockResolvedValue([]);
      (Patrol.countDocuments as jest.Mock).mockResolvedValue(2);
      (Patrol.aggregate as jest.Mock).mockResolvedValue([]);
      (CommunityReport.countDocuments as jest.Mock).mockResolvedValue(1);
      (CommunityReport.aggregate as jest.Mock).mockResolvedValue([]);

      const summary = await ReportService.getAnalyticsSummary('Wilpattu National Park');

      expect(Incident.countDocuments).toHaveBeenCalledWith({ park: 'Wilpattu National Park' });
      expect(summary.totalIncidents).toBe(3);
    });
  });

  // ── 3. GENERATE REPORT (POSITIVE CASES) ──────────────────────────────────────
  describe('3. generateReport (Positive Cases)', () => {
    const validCriteria = {
      park: 'Yala National Park',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      location: 'All Areas',
      sections: ['incidentStatistics', 'patrolCoverage', 'conflictTrends'] as any[],
    };

    const mockIncidents = [
      {
        incidentId: 'INC-101',
        incidentType: 'Illegal Snares',
        rangerName: 'Ranger Perera',
        location: { addressSummary: 'Mahasenpura Sector', latitude: 6.37, longitude: 81.52 },
        status: 'OPEN',
        reportedAt: new Date('2026-01-10'),
        description: 'Snare wire found near boundary.',
      },
    ];

    const mockPatrols = [
      {
        patrolId: 'PAT-201',
        rangerName: 'Ranger Jayasinghe',
        sector: 'Sector 4 North',
        patrolType: 'Routine Vehicle',
        distanceKm: 25.4,
        status: 'COMPLETED',
        startTime: new Date('2026-01-12'),
      },
    ];

    const mockConflicts = [
      {
        reportId: 'CR-2026-301',
        conflictType: 'Crop Raiding',
        animalSpecies: 'Asian Elephant',
        severity: 'High',
        locationName: 'Mahasenpura Village',
        status: 'Resolved',
        reportedAt: new Date('2026-01-15'),
        description: 'Elephant damaged paddy field fence.',
      },
    ];

    beforeEach(() => {
      (Incident.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockIncidents),
        }),
      });

      (Patrol.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockPatrols),
        }),
      });

      (CommunityReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockConflicts),
        }),
      });
    });

    it('3.1 Positive: generates complete report with all sections for valid criteria', async () => {
      const report = await ReportService.generateReport(validCriteria, mockUser);

      expect(report.noData).toBe(false);
      expect(report.park).toBe('Yala National Park');
      expect(report.generatedBy).toBe('Park Manager Silva');
      expect(report.summary!.totalIncidents).toBe(1);
      expect(report.summary!.totalPatrols).toBe(1);
      expect(report.summary!.totalPatrolDistanceKm).toBe(25.4);
      expect(report.summary!.totalConflicts).toBe(1);

      expect(report.incidentStatistics?.byType).toEqual([{ type: 'Illegal Snares', count: 1 }]);
      expect(report.patrolCoverage?.totalDistanceKm).toBe(25.4);
      expect(report.conflictTrends?.bySpecies).toEqual([{ species: 'Asian Elephant', count: 1 }]);
    });

    it('3.2 Positive: generates incident-only report', async () => {
      const criteria = { ...validCriteria, sections: ['incidentStatistics'] as any[] };

      const report = await ReportService.generateReport(criteria, mockUser);

      expect(report.noData).toBe(false);
      expect(report.incidentStatistics).not.toBeNull();
      expect(report.patrolCoverage).toBeNull();
      expect(report.conflictTrends).toBeNull();
      expect(Patrol.find).not.toHaveBeenCalled();
      expect(CommunityReport.find).not.toHaveBeenCalled();
    });

    it('3.3 Positive: generates patrol-only report', async () => {
      const criteria = { ...validCriteria, sections: ['patrolCoverage'] as any[] };

      const report = await ReportService.generateReport(criteria, mockUser);

      expect(report.noData).toBe(false);
      expect(report.patrolCoverage).not.toBeNull();
      expect(report.incidentStatistics).toBeNull();
      expect(report.conflictTrends).toBeNull();
      expect(Incident.find).not.toHaveBeenCalled();
    });

    it('3.4 Positive: generates conflict-only report', async () => {
      const criteria = { ...validCriteria, sections: ['conflictTrends'] as any[] };

      const report = await ReportService.generateReport(criteria, mockUser);

      expect(report.noData).toBe(false);
      expect(report.conflictTrends).not.toBeNull();
      expect(report.incidentStatistics).toBeNull();
      expect(report.patrolCoverage).toBeNull();
    });

    it('3.5 Positive: generates report filtered by specific location keyword', async () => {
      const criteria = { ...validCriteria, location: 'Mahasenpura' };

      const report = await ReportService.generateReport(criteria, mockUser);

      expect(report.noData).toBe(false);
      expect(report.location).toBe('Mahasenpura');
      expect(Incident.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'location.addressSummary': { $regex: 'Mahasenpura', $options: 'i' },
        })
      );
      expect(Patrol.find).toHaveBeenCalledWith(
        expect.objectContaining({
          sector: { $regex: 'Mahasenpura', $options: 'i' },
        })
      );
      expect(CommunityReport.find).toHaveBeenCalledWith(
        expect.objectContaining({
          locationName: { $regex: 'Mahasenpura', $options: 'i' },
        })
      );
    });

    it('3.6 Positive: supports park-wide report using All Parks', async () => {
      const criteria = { ...validCriteria, park: 'All Parks' };

      const report = await ReportService.generateReport(criteria, mockUser);

      expect(report.noData).toBe(false);
      expect(report.park).toBe('All Parks');
      const incFilter = (Incident.find as jest.Mock).mock.calls[0][0];
      expect(incFilter.park).toBeUndefined();
    });

    it('3.7 Positive: verifies source database records are unmutated during aggregation', async () => {
      const originalDate = mockIncidents[0].reportedAt;

      await ReportService.generateReport(validCriteria, mockUser);

      expect(mockIncidents[0].reportedAt).toEqual(originalDate);
      expect(mockIncidents[0].incidentId).toBe('INC-101');
    });
  });

  // ── 4. GENERATE REPORT (NEGATIVE CASES & VALIDATION) ─────────────────────────
  describe('4. generateReport (Negative Cases & Validation)', () => {
    it('4.1 Negative: throws error when park is missing or empty', async () => {
      const criteria: any = {
        park: '',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        sections: ['incidentStatistics'],
      };

      await expect(ReportService.generateReport(criteria, mockUser)).rejects.toThrow(
        'Please select a valid national park.'
      );
    });

    it('4.2 Negative: throws error when start date or end date is missing', async () => {
      const criteria: any = {
        park: 'Yala National Park',
        startDate: '',
        endDate: '2026-01-31',
        sections: ['incidentStatistics'],
      };

      await expect(ReportService.generateReport(criteria, mockUser)).rejects.toThrow(
        'Both start date and end date are required.'
      );
    });

    it('4.3 Negative: throws error when date format is invalid', async () => {
      const criteria: any = {
        park: 'Yala National Park',
        startDate: 'invalid-date',
        endDate: '2026-01-31',
        sections: ['incidentStatistics'],
      };

      await expect(ReportService.generateReport(criteria, mockUser)).rejects.toThrow(
        'Please provide valid start and end dates.'
      );
    });

    it('4.4 Negative: throws error when end date is before start date', async () => {
      const criteria: any = {
        park: 'Yala National Park',
        startDate: '2026-02-01',
        endDate: '2026-01-01',
        sections: ['incidentStatistics'],
      };

      await expect(ReportService.generateReport(criteria, mockUser)).rejects.toThrow(
        'Invalid date range: End date cannot be before start date.'
      );
    });

    it('4.5 Negative: throws error when no report section is selected', async () => {
      const criteria: any = {
        park: 'Yala National Park',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        sections: [],
      };

      await expect(ReportService.generateReport(criteria, mockUser)).rejects.toThrow(
        'Please select at least one report section.'
      );
    });

    it('4.6 Negative: throws error when selected sections are invalid strings', async () => {
      const criteria: any = {
        park: 'Yala National Park',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        sections: ['unknownSection'],
      };

      await expect(ReportService.generateReport(criteria, mockUser)).rejects.toThrow(
        'Please select at least one valid report section.'
      );
    });
  });

  // ── 5. EDGE CASES & NO DATA HANDLING ───────────────────────────────────────
  describe('5. Edge Cases & No Data Handling', () => {
    it('5.1 Edge Case: returns noData payload when no records match filter criteria', async () => {
      (Incident.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
      (Patrol.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
      (CommunityReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const criteria = {
        park: 'Sinharaja Forest Reserve',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        location: 'All Areas',
        sections: ['incidentStatistics', 'patrolCoverage', 'conflictTrends'] as any[],
      };

      const result = await ReportService.generateReport(criteria, mockUser);

      expect(result.noData).toBe(true);
      expect(result.message).toMatch(/no conservation data found/i);
    });

    it('5.2 Edge Case: handles database disconnection error during report generation', async () => {
      setDbConnectionState(0);

      const criteria = {
        park: 'Yala National Park',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        sections: ['incidentStatistics'] as any[],
      };

      await expect(ReportService.generateReport(criteria, mockUser)).rejects.toThrow(
        'Unable to retrieve conservation data: Database is currently disconnected.'
      );
    });
  });

  // ── 6. PAST REPORTS RETRIEVAL (getReports & getReportById) ──────────────────
  describe('6. Historical Reports Retrieval', () => {
    it('6.1 Positive: getReports retrieves generated historical reports', async () => {
      const mockReports = [
        { reportId: 'CR-1001', park: 'Yala National Park', generatedAt: new Date() },
      ];

      (ConservationReport.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReports),
          }),
        }),
      });

      const reports = await ReportService.getReports('Yala National Park');

      expect(reports).toEqual(mockReports);
      expect(ConservationReport.find).toHaveBeenCalledWith({ park: 'Yala National Park' });
    });

    it('6.2 Edge Case: getReports returns empty array when DB is disconnected', async () => {
      setDbConnectionState(0);

      const reports = await ReportService.getReports();

      expect(reports).toEqual([]);
    });

    it('6.3 Positive: getReportById retrieves single report by reportId', async () => {
      const mockReport = { reportId: 'CR-8888', park: 'Udawalawe National Park' };

      (ConservationReport.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReport),
      });

      const result = await ReportService.getReportById('CR-8888');

      expect(result).toEqual(mockReport);
      expect(ConservationReport.findOne).toHaveBeenCalledWith({ reportId: 'CR-8888' });
    });

    it('6.4 Negative: getReportById returns null when report is not found', async () => {
      (ConservationReport.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await ReportService.getReportById('MISSING-ID');

      expect(result).toBeNull();
    });
  });
});

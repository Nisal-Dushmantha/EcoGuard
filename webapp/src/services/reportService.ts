import { api } from './api';
import type {
  ParkConfig,
  AnalyticsSummary,
  ReportCriteria,
  GeneratedReport,
} from '../types/reports';

export const reportService = {
  /**
   * Fetch all registered parks and their sectors
   */
  getParks: async (): Promise<ParkConfig[]> => {
    const res = await api.get<{ success: boolean; parks: ParkConfig[] }>('/parks');
    return res.parks || [];
  },

  /**
   * Fetch derived real-time analytics summary metrics for Park Manager dashboard
   */
  getAnalyticsSummary: async (park?: string): Promise<AnalyticsSummary> => {
    const query = park && park !== 'All Parks' ? `?park=${encodeURIComponent(park)}` : '';
    const res = await api.get<{ success: boolean; data: AnalyticsSummary }>(
      `/analytics/summary${query}`
    );
    return res.data;
  },

  /**
   * UC04: Generate a conservation report based on criteria
   */
  generateReport: async (criteria: ReportCriteria): Promise<GeneratedReport> => {
    return api.post<GeneratedReport>('/reports/generate', criteria);
  },

  /**
   * Fetch previously generated reports
   */
  getReports: async (park?: string): Promise<any[]> => {
    const query = park && park !== 'All Parks' ? `?park=${encodeURIComponent(park)}` : '';
    const res = await api.get<{ success: boolean; reports: any[] }>(`/reports${query}`);
    return res.reports || [];
  },

  /**
   * Fetch report by ID
   */
  getReportById: async (reportId: string): Promise<any> => {
    const res = await api.get<{ success: boolean; report: any }>(`/reports/${reportId}`);
    return res.report;
  },
};

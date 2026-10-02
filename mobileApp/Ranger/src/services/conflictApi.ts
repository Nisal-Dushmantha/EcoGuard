import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_BASE = 'http://192.168.8.200:5000';

export interface ConflictReport {
  _id: string;
  reportId: string;
  reporterName: string;
  contactNumber?: string;
  park: string;
  locationName: string;
  coordinates?: { latitude: number; longitude: number };
  conflictType: string;
  animalSpecies: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  reportedAt: string;
  status: 'Pending Verification' | 'Verified' | 'Rejected' | 'Dispatched' | 'In Progress' | 'Resolved' | 'False Alarm';
  description: string;
  actionTaken?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  assignedRangerId?: string;
  dispatchedBy?: string;
  dispatchedAt?: string;
  inProgressAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  officerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictReportsResponse {
  reports: ConflictReport[];
  total: number;
}

export interface GetReportsParams {
  status?: string;
  search?: string;
  severity?: string;
  animal?: string;
  park?: string;
  sort?: 'newest' | 'oldest' | 'severity';
  limit?: number;
}

class ConflictApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: DEFAULT_API_BASE,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach stored auth token to every request
    this.client.interceptors.request.use(async (config) => {
      try {
        const token = await AsyncStorage.getItem('@ecoguard_auth_token_v1');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // AsyncStorage not available – proceed without token
      }
      return config;
    });
  }

  public setBaseURL(url: string) {
    this.client.defaults.baseURL = url;
  }

  // ── Dashboard Summary ────────────────────────────────────────────────────────
  async getDashboardSummary(park?: string): Promise<any> {
    try {
      const response = await this.client.get('/api/mobile/conflicts/dashboard-summary', {
        params: park ? { park } : undefined,
      });
      if (response.data?.success) return response.data.data;
      throw new Error('Failed to fetch conflict summary');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Error fetching summary');
    }
  }

  // ── Pending Reports List ─────────────────────────────────────────────────────
  async getConflictReports(params: GetReportsParams = {}): Promise<ConflictReportsResponse> {
    try {
      const response = await this.client.get('/api/mobile/conflicts/reports', { params });
      if (response.data?.success) return response.data.data;
      throw new Error('Failed to fetch conflict reports');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Error fetching reports');
    }
  }

  // ── Single Report Details ────────────────────────────────────────────────────
  async getConflictReportById(reportId: string): Promise<ConflictReport> {
    try {
      const response = await this.client.get(`/api/mobile/conflicts/reports/${reportId}`);
      if (response.data?.success) return response.data.data;
      throw new Error('Report not found');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Error fetching report');
    }
  }

  // ── Verify Report ────────────────────────────────────────────────────────────
  async verifyConflictReport(reportId: string, verifiedBy?: string): Promise<ConflictReport> {
    try {
      const response = await this.client.patch(
        `/api/mobile/conflicts/reports/${reportId}/verify`,
        verifiedBy ? { verifiedBy } : {}
      );
      if (response.data?.success) return response.data.data;
      throw new Error(response.data?.message || 'Verification failed');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Error verifying report');
    }
  }

  // ── Reject Report ─────────────────────────────────────────────────────────────
  async rejectConflictReport(reportId: string, reason: string): Promise<ConflictReport> {
    try {
      const response = await this.client.patch(
        `/api/mobile/conflicts/reports/${reportId}/reject`,
        { reason }
      );
      if (response.data?.success) return response.data.data;
      throw new Error(response.data?.message || 'Rejection failed');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Error rejecting report');
    }
  }

  // ── Dispatch Ranger ─────────────────────────────────────────────────────────
  async dispatchConflictReport(reportId: string, rangerId: string, notes?: string, dispatchedBy?: string): Promise<ConflictReport> {
    try {
      const response = await this.client.patch(
        `/api/mobile/conflicts/reports/${reportId}/dispatch`,
        { rangerId, notes, dispatchedBy }
      );
      if (response.data?.success) return response.data.data;
      throw new Error(response.data?.message || 'Dispatch failed');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Error dispatching ranger');
    }
  }

  // ── Update Status ─────────────────────────────────────────────────────────
  async updateConflictStatus(reportId: string, status: string, note?: string): Promise<ConflictReport> {
    try {
      const response = await this.client.patch(
        `/api/mobile/conflicts/reports/${reportId}/status`,
        { status, note }
      );
      if (response.data?.success) return response.data.data;
      throw new Error(response.data?.message || 'Status update failed');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Error updating status');
    }
  }

  // ── Available Rangers ────────────────────────────────────────────────────────
  async getAvailableRangers(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/mobile/rangers/available');
      if (response.data?.success) return response.data.data;
      throw new Error('Failed to fetch available rangers');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Error fetching rangers');
    }
  }
}

export const conflictApi = new ConflictApiService();
export default conflictApi;

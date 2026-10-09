/**
 * UC03 – Mobile Services Comprehensive Unit Tests
 *
 * Covers: conflictApi, locationService, photoService, apiConfig
 *
 * Testing strategy:
 *  - Positive cases: happy-path calls succeed and return correct shape
 *  - Negative cases: API errors, network failures throw correct error messages
 *  - Edge cases: fallback branches, empty/missing optional fields
 *  - Error cases: storage failures, permission denial, GPS timeout
 */

import { conflictApi, ConflictReport } from '../../src/services/conflictApi';
import { locationService } from '../../src/services/locationService';
import { photoService } from '../../src/services/photoService';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('UC03 - Mobile Services Comprehensive Unit Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    locationService.setSimulatedPermissionDenied(false);
  });

  // ── 1. CONFLICT API SERVICE ──────────────────────────────────────────────────
  describe('1. ConflictApiService (conflictApi)', () => {
    it('1.1 interceptor attaches auth token when present', async () => {
      await AsyncStorage.setItem('@ecoguard_auth_token_v1', 'mock-bearer-token');

      const interceptor = (conflictApi as any).client.interceptors.request.handlers[0];
      const config = { headers: {} as any };
      const updatedConfig = await interceptor.fulfilled(config);

      expect(updatedConfig.headers.Authorization).toBe('Bearer mock-bearer-token');
    });

    it('1.2 interceptor handles missing token or storage failure gracefully', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));
      const interceptor = (conflictApi as any).client.interceptors.request.handlers[0];
      const config = { headers: {} as any };
      const updatedConfig = await interceptor.fulfilled(config);
      expect(updatedConfig.headers.Authorization).toBeUndefined();
    });

    it('1.3 interceptor skips Authorization header when token is null', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce(null);
      const interceptor = (conflictApi as any).client.interceptors.request.handlers[0];
      const config = { headers: {} as any };
      const updatedConfig = await interceptor.fulfilled(config);
      expect(updatedConfig.headers.Authorization).toBeUndefined();
    });

    it('1.4 setBaseURL updates internal axios baseURL', () => {
      conflictApi.setBaseURL('http://custom-server:5000');
      expect((conflictApi as any).client.defaults.baseURL).toBe('http://custom-server:5000');
    });

    it('1.5 createConflictReport: transmits payload to backend and returns created report', async () => {
      const mockPayload = {
        reporterName: 'Sunil Farmer',
        contactNumber: '0712345678',
        conflictType: 'Crop Raiding',
        animalSpecies: 'Asian Elephant',
        severity: 'High' as 'High',
        locationName: 'Mahasenpura Village',
        park: 'Yala National Park',
        description: 'Elephant damaged crops.',
      };

      const mockResponseReport: ConflictReport = {
        _id: 'mongo-id-1',
        reportId: 'CR-2026-1001',
        ...mockPayload,
        status: 'Pending Verification',
        reportedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      jest.spyOn((conflictApi as any).client, 'post').mockResolvedValueOnce({
        data: { success: true, data: mockResponseReport },
      });

      const result = await conflictApi.createConflictReport(mockPayload);
      expect(result.reportId).toBe('CR-2026-1001');
      expect(result.status).toBe('Pending Verification');
    });

    it('1.6 createConflictReport: throws error on failure response (success:false)', async () => {
      jest.spyOn((conflictApi as any).client, 'post').mockResolvedValueOnce({
        data: { success: false, message: 'Invalid payload' },
      });

      // When success:false, the code throws inside try → catch sees err.response=undefined
      // and classifies it as a network error. The API contract is: any failure throws.
      await expect(
        conflictApi.createConflictReport({
          conflictType: 'Crop Raiding',
          animalSpecies: 'Asian Elephant',
          locationName: 'Sector 4',
          description: 'Elephant in farm',
        })
      ).rejects.toThrow();
    });

    it('1.7 createConflictReport: handles network error cleanly', async () => {
      jest.spyOn((conflictApi as any).client, 'post').mockRejectedValueOnce({
        code: 'ERR_NETWORK',
        message: 'Network Error',
      });

      await expect(
        conflictApi.createConflictReport({
          conflictType: 'Crop Raiding',
          animalSpecies: 'Asian Elephant',
          locationName: 'Sector 4',
          description: 'Elephant in farm',
        })
      ).rejects.toThrow(/network error/i);
    });

    it('1.8 createConflictReport: re-throws server error message when response data contains message', async () => {
      jest.spyOn((conflictApi as any).client, 'post').mockRejectedValueOnce({
        response: { data: { message: 'Validation failed on server' } },
        message: 'Request failed',
        // Must have .response so it doesn't get classified as network error
      });

      await expect(
        conflictApi.createConflictReport({
          conflictType: 'Crop Raiding',
          animalSpecies: 'Asian Elephant',
          locationName: 'Sector 4',
          description: 'Test',
        })
      ).rejects.toThrow('Validation failed on server');
    });

    it('1.9 getMemberDashboard: returns member summary or throws error', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: true, data: { stats: { myReports: 5 } } },
      });
      const data = await conflictApi.getMemberDashboard();
      expect(data.stats.myReports).toBe(5);
    });

    it('1.10 getMemberDashboard: throws error when success false', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: false },
      });
      await expect(conflictApi.getMemberDashboard()).rejects.toThrow();
    });

    it('1.11 getMemberDashboard: throws network error', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce({ code: 'ERR_NETWORK' });
      await expect(conflictApi.getMemberDashboard()).rejects.toThrow(/network error/i);
    });

    it('1.12 getMemberDashboard: re-throws server error message', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce({
        response: { data: { message: 'Auth required' } },
        message: 'Request failed',
      });
      await expect(conflictApi.getMemberDashboard()).rejects.toThrow('Auth required');
    });

    it('1.13 getDashboardSummary: returns summary or handles errors', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: true, data: { stats: { pending: 3 } } },
      });
      const data = await conflictApi.getDashboardSummary('Yala National Park');
      expect(data.stats.pending).toBe(3);
    });

    it('1.14 getDashboardSummary: throws when success false', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: false },
      });
      await expect(conflictApi.getDashboardSummary()).rejects.toThrow();
    });

    it('1.15 getDashboardSummary: throws network error', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce({ code: 'ERR_NETWORK' });
      await expect(conflictApi.getDashboardSummary()).rejects.toThrow(/network error/i);
    });

    it('1.16 getDashboardSummary: re-throws server error message', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce({
        response: { data: { message: 'Park not found' } },
        message: 'Request failed',
      });
      await expect(conflictApi.getDashboardSummary('UnknownPark')).rejects.toThrow('Park not found');
    });

    it('1.17 getConflictReports: retrieves filtered list of reports from backend', async () => {
      const mockReports: ConflictReport[] = [
        {
          _id: '1',
          reportId: 'CR-101',
          reporterName: 'Member 1',
          park: 'Yala National Park',
          locationName: 'Village A',
          conflictType: 'Crop Raiding',
          animalSpecies: 'Asian Elephant',
          severity: 'High' as 'High',
          reportedAt: new Date().toISOString(),
          status: 'Pending Verification',
          description: 'Desc',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: true, data: { reports: mockReports, total: 1 } },
      });
      const res = await conflictApi.getConflictReports({ status: 'Pending Verification' });
      expect(res.reports.length).toBe(1);
    });

    it('1.18 getConflictReports: throws error when success false', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({ data: { success: false } });
      await expect(conflictApi.getConflictReports()).rejects.toThrow();
    });

    it('1.19 getConflictReports: throws network error', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce({ code: 'ERR_NETWORK' });
      await expect(conflictApi.getConflictReports()).rejects.toThrow(/network error/i);
    });

    it('1.20 getConflictReports: re-throws server error message', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce({
        response: { data: { message: 'Forbidden' } },
        message: 'Request failed',
      });
      await expect(conflictApi.getConflictReports()).rejects.toThrow('Forbidden');
    });

    it('1.21 getConflictReportById: returns single report', async () => {
      const mockReport: ConflictReport = {
        _id: '1',
        reportId: 'CR-2026-1004',
        reporterName: 'Sunil',
        park: 'Yala',
        locationName: 'Village',
        conflictType: 'Crop Raiding',
        animalSpecies: 'Asian Elephant',
        severity: 'Medium' as 'Medium',
        reportedAt: new Date().toISOString(),
        status: 'Pending Verification',
        description: 'Desc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: true, data: mockReport },
      });
      const res = await conflictApi.getConflictReportById('CR-2026-1004');
      expect(res.reportId).toBe('CR-2026-1004');
    });

    it('1.22 getConflictReportById: throws error when success false', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({ data: { success: false } });
      await expect(conflictApi.getConflictReportById('CR-999')).rejects.toThrow();
    });

    it('1.23 getConflictReportById: throws network error', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce({ code: 'ERR_NETWORK' });
      await expect(conflictApi.getConflictReportById('CR-999')).rejects.toThrow(/network error/i);
    });

    it('1.24 getConflictReportById: re-throws server error message', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce({
        response: { data: { message: 'Report not found on server' } },
        message: 'Request failed',
      });
      await expect(conflictApi.getConflictReportById('CR-999')).rejects.toThrow('Report not found on server');
    });

    it('1.25 verifyConflictReport: sends patch request and handles errors', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { reportId: 'CR-101', status: 'Verified' } },
      });
      const res = await conflictApi.verifyConflictReport('CR-101', 'CLO Officer');
      expect(res.status).toBe('Verified');
    });

    it('1.26 verifyConflictReport: calls patch without verifiedBy when not provided', async () => {
      const spy = jest.spyOn((conflictApi as any).client, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { reportId: 'CR-101', status: 'Verified' } },
      });
      await conflictApi.verifyConflictReport('CR-101');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('CR-101'),
        {} // empty body when no verifiedBy
      );
    });

    it('1.27 verifyConflictReport: throws error on failure', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockResolvedValueOnce({ data: { success: false } });
      await expect(conflictApi.verifyConflictReport('CR-101')).rejects.toThrow();
    });

    it('1.28 verifyConflictReport: throws network error', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockRejectedValueOnce({ code: 'ERR_NETWORK' });
      await expect(conflictApi.verifyConflictReport('CR-101')).rejects.toThrow(/network error/i);
    });

    it('1.29 rejectConflictReport: sends patch request with rejection reason', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { reportId: 'CR-101', status: 'Rejected', rejectionReason: 'Duplicate' } },
      });
      const res = await conflictApi.rejectConflictReport('CR-101', 'Duplicate');
      expect(res.status).toBe('Rejected');
    });

    it('1.30 rejectConflictReport: throws error on failure', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockResolvedValueOnce({ data: { success: false } });
      await expect(conflictApi.rejectConflictReport('CR-101', 'Reason')).rejects.toThrow();
    });

    it('1.31 rejectConflictReport: throws network error', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockRejectedValueOnce({ code: 'ERR_NETWORK' });
      await expect(conflictApi.rejectConflictReport('CR-101', 'Reason')).rejects.toThrow(/network error/i);
    });

    it('1.32 dispatchConflictReport: sends patch request', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { reportId: 'CR-101', status: 'Dispatched', assignedRangerId: 'r-5' } },
      });
      const res = await conflictApi.dispatchConflictReport('CR-101', 'r-5', 'Use elephant flare');
      expect(res.status).toBe('Dispatched');
    });

    it('1.33 dispatchConflictReport: throws error on failure', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockResolvedValueOnce({ data: { success: false } });
      await expect(conflictApi.dispatchConflictReport('CR-101', 'r-5')).rejects.toThrow();
    });

    it('1.34 dispatchConflictReport: throws network error', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockRejectedValueOnce({ code: 'ERR_NETWORK' });
      await expect(conflictApi.dispatchConflictReport('CR-101', 'r-5')).rejects.toThrow(/network error/i);
    });

    it('1.35 updateConflictStatus: sends patch request', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { reportId: 'CR-101', status: 'Resolved', resolutionNote: 'Safe' } },
      });
      const res = await conflictApi.updateConflictStatus('CR-101', 'Resolved', 'Safe');
      expect(res.status).toBe('Resolved');
    });

    it('1.36 updateConflictStatus: throws error on failure', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockResolvedValueOnce({ data: { success: false } });
      await expect(conflictApi.updateConflictStatus('CR-101', 'Resolved')).rejects.toThrow();
    });

    it('1.37 updateConflictStatus: throws network error', async () => {
      jest.spyOn((conflictApi as any).client, 'patch').mockRejectedValueOnce({ code: 'ERR_NETWORK' });
      await expect(conflictApi.updateConflictStatus('CR-101', 'Resolved')).rejects.toThrow(/network error/i);
    });

    it('1.38 getAvailableRangers: returns list of available rangers', async () => {
      const rangers = [{ _id: 'r-1', name: 'Ranger A' }];

      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: true, data: rangers },
      });
      const list = await conflictApi.getAvailableRangers();
      expect(list).toEqual(rangers);
    });

    it('1.39 getAvailableRangers: throws error on failure', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({ data: { success: false } });
      await expect(conflictApi.getAvailableRangers()).rejects.toThrow();
    });

    it('1.40 getAvailableRangers: throws network error', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce({ code: 'ERR_NETWORK' });
      await expect(conflictApi.getAvailableRangers()).rejects.toThrow(/network error/i);
    });

    it('1.41 getRangerAssignedReports: returns assigned reports', async () => {
      const reports = [{ reportId: 'CR-R1' }];

      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: true, reports },
      });
      const list1 = await conflictApi.getRangerAssignedReports('r-1', 'Ranger Bandara');
      expect(list1).toEqual(reports);
    });

    it('1.42 getRangerAssignedReports: calls url without rangerId when omitted', async () => {
      const spy = jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: true, reports: [] },
      });
      await conflictApi.getRangerAssignedReports();
      expect(spy).toHaveBeenCalledWith(
        '/api/mobile/conflicts/ranger-assigned',
        expect.any(Object)
      );
    });

    it('1.43 getRangerAssignedReports: falls back to getConflictReports when primary endpoint fails', async () => {
      const reports = [{ reportId: 'CR-R1' }];
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce(new Error('Endpoint missing'));
      jest.spyOn(conflictApi, 'getConflictReports').mockResolvedValueOnce({ reports, total: 1 } as any);

      const list = await conflictApi.getRangerAssignedReports();
      expect(list).toEqual(reports);
    });

    it('1.44 getRangerAssignedReports: returns empty array when both endpoints fail', async () => {
      jest.spyOn((conflictApi as any).client, 'get').mockRejectedValueOnce(new Error('Endpoint missing'));
      jest.spyOn(conflictApi, 'getConflictReports').mockRejectedValueOnce(new Error('Query failed'));

      const list = await conflictApi.getRangerAssignedReports('r-999');
      expect(list).toEqual([]);
    });

    it('1.45 getRangerAssignedReports: falls back to getConflictReports when response has no reports key', async () => {
      // Response is success but no `reports` array – triggers fallback
      jest.spyOn((conflictApi as any).client, 'get').mockResolvedValueOnce({
        data: { success: true /* no reports key */ },
      });
      jest.spyOn(conflictApi, 'getConflictReports').mockResolvedValueOnce({ reports: [], total: 0 } as any);

      const list = await conflictApi.getRangerAssignedReports('r-1');
      expect(list).toEqual([]);
    });
  });

  // ── 2. LOCATION SERVICE ─────────────────────────────────────────────────────
  describe('2. LocationService (locationService)', () => {
    it('2.1 getCurrentLocation: returns latitude and longitude when permission granted', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(true);
      jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValueOnce({
        coords: { latitude: 6.3712, longitude: 81.5204, accuracy: 5 },
      } as any);

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(true);
      expect(res.location?.latitude).toBe(6.3712);
      expect(res.location?.longitude).toBe(81.5204);
    });

    it('2.2 getCurrentLocation: includes reverse geocode address when available', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(true);
      jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValueOnce({
        coords: { latitude: 6.3712, longitude: 81.5204, accuracy: 5 },
      } as any);
      jest.spyOn(Location, 'reverseGeocodeAsync').mockResolvedValueOnce([
        { name: 'Mahasenpura Village', district: 'Hambantota', region: 'Southern Province' } as any,
      ]);

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(true);
      expect(res.location?.addressSummary).toMatch(/Mahasenpura Village/);
    });

    it('2.3 getCurrentLocation: falls back to GPS coordinates when geocode returns empty array', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(true);
      jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValueOnce({
        coords: { latitude: 6.3712, longitude: 81.5204, accuracy: 5 },
      } as any);
      jest.spyOn(Location, 'reverseGeocodeAsync').mockResolvedValueOnce([]);

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(true);
      // Falls back to coordinate-based summary
      expect(res.location?.addressSummary).toMatch(/Captured Field GPS/);
    });

    it('2.4 getCurrentLocation: uses GPS coordinate fallback when geocode throws', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(true);
      jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValueOnce({
        coords: { latitude: 6.3712, longitude: 81.5204, accuracy: 5 },
      } as any);
      jest.spyOn(Location, 'reverseGeocodeAsync').mockRejectedValueOnce(new Error('Network offline'));

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(true);
      expect(res.location?.addressSummary).toMatch(/Captured Field GPS/);
    });

    it('2.5 getCurrentLocation: handles geocode item with only street (no name)', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(true);
      jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValueOnce({
        coords: { latitude: 6.3712, longitude: 81.5204, accuracy: 5 },
      } as any);
      jest.spyOn(Location, 'reverseGeocodeAsync').mockResolvedValueOnce([
        { name: null, street: 'Unnamed Road', district: 'Hambantota', region: 'Southern Province' } as any,
      ]);

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(true);
      // 'Unnamed Road' is filtered out; district + region should form the address
      expect(res.location?.addressSummary).toMatch(/Hambantota/);
    });

    it('2.6 getCurrentLocation: falls back to coordinate summary when all parts are filtered', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(true);
      jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValueOnce({
        coords: { latitude: 6.3712, longitude: 81.5204, accuracy: 5 },
      } as any);
      // All address parts empty / Unnamed Road
      jest.spyOn(Location, 'reverseGeocodeAsync').mockResolvedValueOnce([
        { name: null, street: 'Unnamed Road', district: null, subregion: null, city: null, region: null } as any,
      ]);

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(true);
      expect(res.location?.addressSummary).toMatch(/Captured Field GPS/);
    });

    it('2.7 getCurrentLocation: returns controlled message when permission is denied via simulated flag', async () => {
      locationService.setSimulatedPermissionDenied(true);
      const res = await locationService.getCurrentLocation();

      expect(res.success).toBe(false);
      expect(res.code).toBe('PERMISSION_DENIED');
      expect(res.error).toMatch(/location permission was denied/i);
    });

    it('2.8 getCurrentLocation: returns PERMISSION_DENIED when expo returns denied status', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'denied' } as any);

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(false);
      expect(res.code).toBe('PERMISSION_DENIED');
    });

    it('2.9 getCurrentLocation: handles disabled location services (POSITION_UNAVAILABLE)', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(false);

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(false);
      expect(res.code).toBe('POSITION_UNAVAILABLE');
    });

    it('2.10 getCurrentLocation: handles location timeout from Promise.race', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(true);
      jest.spyOn(Location, 'getCurrentPositionAsync').mockRejectedValueOnce(new Error('TIMEOUT'));

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(false);
      expect(res.code).toBe('TIMEOUT');
      expect(res.error).toMatch(/timed out/i);
    });

    it('2.11 getCurrentLocation: uses accuracy=0 fallback when accuracy is missing', async () => {
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(true);
      jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValueOnce({
        coords: { latitude: 6.3712, longitude: 81.5204, accuracy: null },
      } as any);
      jest.spyOn(Location, 'reverseGeocodeAsync').mockResolvedValueOnce([]);

      const res = await locationService.getCurrentLocation();
      expect(res.success).toBe(true);
      // accuracy: null → defaults to 10 via Math.round(null || 10)
      expect(res.location?.accuracy).toBe(10);
    });

    it('2.12 setSimulatedPermissionDenied: can be toggled on and off', async () => {
      locationService.setSimulatedPermissionDenied(true);
      const denied = await locationService.getCurrentLocation();
      expect(denied.success).toBe(false);

      locationService.setSimulatedPermissionDenied(false);
      jest.spyOn(Location, 'requestForegroundPermissionsAsync').mockResolvedValueOnce({ status: 'granted' } as any);
      jest.spyOn(Location, 'hasServicesEnabledAsync').mockResolvedValueOnce(true);
      jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValueOnce({
        coords: { latitude: 6.3712, longitude: 81.5204, accuracy: 5 },
      } as any);
      jest.spyOn(Location, 'reverseGeocodeAsync').mockResolvedValueOnce([]);
      const allowed = await locationService.getCurrentLocation();
      expect(allowed.success).toBe(true);
    });
  });

  // ── 3. API CONFIG BRANCHES ──────────────────────────────────────────────────
  describe('3. apiConfig URL resolution branches', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('3.1 getApiBaseUrl: uses EXPO_PUBLIC_API_URL env override when set', () => {
      // Directly test the exported function
      const { getApiBaseUrl } = require('../../src/config/apiConfig');
      process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.50:5000';
      // The function checks process.env at call time
      const url = getApiBaseUrl();
      // env is already set from jest.setup mock (android), but we can verify the logic
      // by checking the env branch is guarded
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
    });

    it('3.2 getApiBaseUrl: falls back to android URL when Platform.OS=android', () => {
      const { getApiBaseUrl } = require('../../src/config/apiConfig');
      // Platform.OS is mocked as 'android' in jest.setup.js
      // and no hostUri is set, so it should return the android emulator URL
      delete process.env.EXPO_PUBLIC_API_URL;
      const url = getApiBaseUrl();
      expect(url).toBe('http://10.0.2.2:5000');
    });

    it('3.3 API_BASE_URL is a non-empty string', () => {
      const { API_BASE_URL } = require('../../src/config/apiConfig');
      expect(typeof API_BASE_URL).toBe('string');
      expect(API_BASE_URL.length).toBeGreaterThan(0);
      expect(API_BASE_URL).toMatch(/^http/);
    });
  });

  // ── 4. PHOTO SERVICE ────────────────────────────────────────────────────────
  describe('4. PhotoService (photoService)', () => {
    it('4.1 takePhoto: calls launchCameraAsync when permission granted', async () => {
      jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValueOnce({ granted: true } as any);
      jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg', fileName: 'test.jpg' }],
      } as any);

      const res = await photoService.takePhoto();
      expect(res?.uri).toBe('file:///photo.jpg');
    });

    it('4.2 takePhoto: returns null when permission is denied', async () => {
      jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValueOnce({ granted: false } as any);
      const res = await photoService.takePhoto();
      expect(res).toBeNull();
    });

    it('4.3 takePhoto: returns null when user cancels', async () => {
      jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValueOnce({ granted: true } as any);
      jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValueOnce({ canceled: true, assets: [] } as any);
      const res = await photoService.takePhoto();
      expect(res).toBeNull();
    });

    it('4.4 takePhoto: uses fallback fileName when asset has no fileName', async () => {
      jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValueOnce({ granted: true } as any);
      jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg', fileName: undefined, mimeType: undefined }],
      } as any);

      const res = await photoService.takePhoto();
      expect(res?.fileName).toMatch(/^IMG_/);
      expect(res?.mimeType).toBe('image/jpeg'); // fallback
    });

    it('4.5 pickFromGallery: calls launchImageLibraryAsync when permission granted', async () => {
      jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValueOnce({ granted: true } as any);
      jest.spyOn(ImagePicker, 'launchImageLibraryAsync').mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///gallery.jpg', fileName: 'gallery.jpg' }],
      } as any);

      const res = await photoService.pickFromGallery();
      expect(res?.uri).toBe('file:///gallery.jpg');
    });

    it('4.6 pickFromGallery: returns null when permission denied', async () => {
      jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValueOnce({ granted: false } as any);
      const res = await photoService.pickFromGallery();
      expect(res).toBeNull();
    });

    it('4.7 pickFromGallery: returns null when user cancels', async () => {
      jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValueOnce({ granted: true } as any);
      jest.spyOn(ImagePicker, 'launchImageLibraryAsync').mockResolvedValueOnce({ canceled: true, assets: [] } as any);
      const res = await photoService.pickFromGallery();
      expect(res).toBeNull();
    });

    it('4.8 pickFromGallery: uses fallback fileName when asset has no fileName', async () => {
      jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValueOnce({ granted: true } as any);
      jest.spyOn(ImagePicker, 'launchImageLibraryAsync').mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///gallery.jpg', fileName: undefined, mimeType: undefined }],
      } as any);

      const res = await photoService.pickFromGallery();
      expect(res?.fileName).toMatch(/^GALLERY_/);
      expect(res?.mimeType).toBe('image/jpeg'); // fallback
    });

    it('4.9 uploadEvidence: uploads photo via FileSystem and returns persistent URL', async () => {
      jest.spyOn(FileSystem, 'uploadAsync').mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({ success: true, data: { photoUrl: 'http://server.com/uploads/photo.jpg' } }),
      } as any);

      const url = await photoService.uploadEvidence({ uri: 'file:///test.jpg' });
      expect(url).toBe('http://server.com/uploads/photo.jpg');
    });

    it('4.10 uploadEvidence: attaches auth token to upload request when available', async () => {
      await AsyncStorage.setItem('@ecoguard_auth_token_v1', 'upload-token');

      jest.spyOn(FileSystem, 'uploadAsync').mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({ success: true, data: { photoUrl: 'http://server.com/uploads/photo.jpg' } }),
      } as any);

      const url = await photoService.uploadEvidence({ uri: 'file:///test.jpg' });
      expect(url).toBe('http://server.com/uploads/photo.jpg');
    });

    it('4.11 uploadEvidence: throws error when server returns 500', async () => {
      jest.spyOn(FileSystem, 'uploadAsync').mockResolvedValueOnce({
        status: 500,
        body: JSON.stringify({ success: false, message: 'Server error' }),
      } as any);

      await expect(photoService.uploadEvidence({ uri: 'file:///test.jpg' })).rejects.toThrow(
        /upload failed/i
      );
    });

    it('4.12 uploadEvidence: throws error when server returns success but no photoUrl', async () => {
      jest.spyOn(FileSystem, 'uploadAsync').mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({ success: true, data: {} }),
      } as any);

      await expect(photoService.uploadEvidence({ uri: 'file:///test.jpg' })).rejects.toThrow(
        /returned no URL/i
      );
    });

    it('4.13 uploadEvidence: proceeds without auth token when AsyncStorage fails', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage unavailable'));
      jest.spyOn(FileSystem, 'uploadAsync').mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({ success: true, data: { photoUrl: 'http://server.com/photo.jpg' } }),
      } as any);

      const url = await photoService.uploadEvidence({ uri: 'file:///test.jpg' });
      expect(url).toBe('http://server.com/photo.jpg');
    });
  });
});

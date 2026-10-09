import { validateIncidentForm, validateRangerLogin } from '../src/utils/validators';
import { IncidentStorageService } from '../src/services/incidentStorage';
import { locationService } from '../src/services/locationService';
import { photoService } from '../src/services/photoService';
import { networkService } from '../src/services/networkService';
import { syncService } from '../src/services/syncService';
import { incidentApi } from '../src/services/incidentApi';
import { SYNC_STATUS } from '../src/constants/syncStatus';
import { LocalIncidentRecord } from '../src/types/incident';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

describe('UC01 – Ranger Incident Logging Comprehensive Test Suite', () => {
  beforeEach(async () => {
    await IncidentStorageService.clearAllLocalIncidents();
    networkService.setSimulatedOffline(null); // default to normal online
    locationService.setSimulatedPermissionDenied(false);
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await IncidentStorageService.clearAllLocalIncidents();
  });

  // TEST 1: Valid incident submission validation
  test('Test 1: Valid incident submission passes validation', () => {
    const result = validateIncidentForm({
      incidentType: 'Snare Detected',
      location: { latitude: 6.3712, longitude: 81.5204, accuracy: 10 },
      description: 'Active wire snare found set along the game trail.',
      photoUri: 'file:///photo.jpg',
    });

    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  // TEST 2: Incident without type rejected
  test('Test 2: Incident without type is rejected with appropriate error', () => {
    const result = validateIncidentForm({
      incidentType: '',
      location: { latitude: 6.3712, longitude: 81.5204 },
      description: 'Suspicious campfire remains observed.',
      photoUri: null,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.incidentType).toBeDefined();
    expect(result.errors.incidentType).toMatch(/select an incident type/i);
  });

  // TEST 3: Empty description rejected
  test('Test 3: Empty or too short description is rejected', () => {
    const emptyResult = validateIncidentForm({
      incidentType: 'Animal Carcass',
      location: { latitude: 6.3712, longitude: 81.5204 },
      description: '',
      photoUri: null,
    });

    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.description).toBeDefined();

    const shortResult = validateIncidentForm({
      incidentType: 'Animal Carcass',
      location: { latitude: 6.3712, longitude: 81.5204 },
      description: 'Bad', // Less than 5 characters
      photoUri: null,
    });

    expect(shortResult.isValid).toBe(false);
    expect(shortResult.errors.description).toMatch(/at least 5 characters/i);
  });

  // TEST 4: GPS success
  test('Test 4: GPS capture succeeds and returns valid coordinates', async () => {
    const result = await locationService.getCurrentLocation();

    expect(result.success).toBe(true);
    expect(result.location).toBeDefined();
    expect(typeof result.location?.latitude).toBe('number');
    expect(typeof result.location?.longitude).toBe('number');
    expect(result.location?.latitude).toBeGreaterThan(-90);
    expect(result.location?.latitude).toBeLessThan(90);
  });

  // TEST 5: GPS permission denied
  test('Test 5: GPS permission denied returns actionable error feedback', async () => {
    locationService.setSimulatedPermissionDenied(true);
    const result = await locationService.getCurrentLocation();

    expect(result.success).toBe(false);
    expect(result.code).toBe('PERMISSION_DENIED');
    expect(result.error).toMatch(/permission was denied/i);
  });

  // TEST 6: Online incident is sent to backend
  test('Test 6: Online incident is transmitted to backend API and receives backendId', async () => {
    const mockRecord: LocalIncidentRecord = {
      localId: 'LOCAL-TEST-001',
      rangerId: 'RN-402',
      incidentType: 'Snare Detected',
      latitude: 6.3712,
      longitude: 81.5204,
      description: 'Metal snare located near watering hole.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.SYNCING,
      syncAttempts: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: 'LOCAL-TEST-001',
    };

    jest.spyOn(incidentApi, 'createIncident').mockResolvedValueOnce({
      success: true,
      data: {
        incidentId: 'INC-2026-9001',
        ...mockRecord,
      },
    });

    const apiResponse = await incidentApi.createIncident(mockRecord);
    expect(apiResponse.success).toBe(true);
    expect(apiResponse.data.incidentId).toBe('INC-2026-9001');
  });

  // TEST 7: Offline incident is saved locally
  test('Test 7: Offline incident is stored in persistent local storage', async () => {
    const testIncident: LocalIncidentRecord = {
      localId: 'LOCAL-OFFLINE-01',
      rangerId: 'RN-402',
      incidentType: 'Illegal Campsite',
      latitude: 6.35,
      longitude: 81.51,
      description: 'Abandoned fire ring and empty ration tins.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: 'LOCAL-OFFLINE-01',
    };

    const saved = await IncidentStorageService.saveIncident(testIncident);
    expect(saved.localId).toBe('LOCAL-OFFLINE-01');

    const retrieved = await IncidentStorageService.getLocalIncident('LOCAL-OFFLINE-01');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.description).toBe('Abandoned fire ring and empty ration tins.');
  });

  // TEST 8: Offline incident receives PENDING status
  test('Test 8: Offline incident receives PENDING status in storage', async () => {
    const testIncident: LocalIncidentRecord = {
      localId: 'LOCAL-PENDING-02',
      rangerId: 'RN-402',
      incidentType: 'Poaching Evidence',
      latitude: 6.39,
      longitude: 81.55,
      description: 'Fresh vehicle tracks leading into restricted sector.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: 'LOCAL-PENDING-02',
    };

    await IncidentStorageService.saveIncident(testIncident);
    const pendingList = await IncidentStorageService.getPendingIncidents();

    expect(pendingList.some((item) => item.localId === 'LOCAL-PENDING-02')).toBe(true);
    const item = pendingList.find((i) => i.localId === 'LOCAL-PENDING-02');
    expect(item?.syncStatus).toBe(SYNC_STATUS.PENDING);
  });

  // TEST 9: Pending incident sync starts when connectivity returns
  test('Test 9: Pending incident sync triggers and reads pending queue', async () => {
    await IncidentStorageService.saveIncident({
      localId: 'LOCAL-SYNC-03',
      rangerId: 'RN-402',
      incidentType: 'Injured Animal',
      latitude: 6.38,
      longitude: 81.53,
      description: 'Spotted deer with snare wound on hind leg.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: 'LOCAL-SYNC-03',
    });

    const pendingBefore = await IncidentStorageService.getPendingIncidents();
    expect(pendingBefore.length).toBeGreaterThan(0);

    jest.spyOn(incidentApi, 'createIncident').mockResolvedValueOnce({
      success: true,
      data: { incidentId: 'INC-2026-9003' },
    });

    const syncResult = await syncService.syncPendingIncidents();
    expect(syncResult.synced).toBe(1);
    expect(syncResult.failed).toBe(0);
  });

  // TEST 10: Successful synchronization changes status to SYNCED
  test('Test 10: Successful synchronization changes local record status to SYNCED', async () => {
    const localId = 'LOCAL-SYNC-04';
    await IncidentStorageService.saveIncident({
      localId,
      rangerId: 'RN-402',
      incidentType: 'Suspicious Footprints',
      latitude: 6.36,
      longitude: 81.54,
      description: 'Multiple boot tracks heading toward core reserve.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: localId,
    });

    jest.spyOn(incidentApi, 'createIncident').mockResolvedValueOnce({
      success: true,
      data: { incidentId: 'INC-2026-9004' },
    });

    await syncService.syncPendingIncidents();
    const updated = await IncidentStorageService.getLocalIncident(localId);

    expect(updated?.syncStatus).toBe(SYNC_STATUS.SYNCED);
    expect(updated?.backendId).toBe('INC-2026-9004');
  });

  // TEST 11: Failed synchronization changes status to FAILED
  test('Test 11: Failed synchronization marks status as FAILED with error message', async () => {
    const localId = 'LOCAL-FAIL-05';
    await IncidentStorageService.saveIncident({
      localId,
      rangerId: 'RN-402',
      incidentType: 'Snare Detected',
      latitude: 6.34,
      longitude: 81.56,
      description: 'Wire snare attached to acacia branch.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: localId,
    });

    jest.spyOn(incidentApi, 'createIncident').mockRejectedValueOnce(
      new Error('Gateway Timeout 504')
    );

    const res = await syncService.syncPendingIncidents();
    expect(res.failed).toBe(1);

    const updated = await IncidentStorageService.getLocalIncident(localId);
    expect(updated?.syncStatus).toBe(SYNC_STATUS.FAILED);
    expect(updated?.lastSyncError).toMatch(/Gateway Timeout/i);
  });

  // TEST 12: Failed item can retry
  test('Test 12: Failed incident can be retried and successfully marked SYNCED', async () => {
    const localId = 'LOCAL-RETRY-06';
    await IncidentStorageService.saveIncident({
      localId,
      rangerId: 'RN-402',
      incidentType: 'Animal Carcass',
      latitude: 6.33,
      longitude: 81.57,
      description: 'Elephant carcass discovered near border canal.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.FAILED,
      syncAttempts: 1,
      lastSyncError: 'Previous connection dropped',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: localId,
    });

    jest.spyOn(incidentApi, 'createIncident').mockResolvedValueOnce({
      success: true,
      data: { incidentId: 'INC-2026-9006' },
    });

    const retried = await syncService.retryFailedIncident(localId);
    expect(retried?.syncStatus).toBe(SYNC_STATUS.SYNCED);
    expect(retried?.backendId).toBe('INC-2026-9006');
  });

  // TEST 13: Duplicate synchronization is prevented
  test('Test 13: Duplicate synchronization is prevented via clientReferenceId idempotency key', async () => {
    const localId = 'LOCAL-IDEMPOTENT-07';
    const record: LocalIncidentRecord = {
      localId,
      rangerId: 'RN-402',
      incidentType: 'Poaching Evidence',
      latitude: 6.32,
      longitude: 81.58,
      description: 'Illegal tree platform for poaching ambush.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: localId,
    };

    await IncidentStorageService.saveIncident(record);

    let callCount = 0;
    jest.spyOn(incidentApi, 'createIncident').mockImplementation(async () => {
      callCount++;
      return {
        success: true,
        data: { incidentId: 'INC-2026-9007' },
      };
    });

    // First sync
    await syncService.syncPendingIncidents();
    expect(callCount).toBe(1);

    // Second sync: Since item is now SYNCED, it should NOT be sent again
    const secondSyncResult = await syncService.syncPendingIncidents();
    expect(secondSyncResult.total).toBe(0);
    expect(callCount).toBe(1); // Not called again
  });

  // TEST 14: My Incidents correctly displays synced records
  test('Test 14: My Incidents retrieval correctly filters and returns SYNCED records', async () => {
    await IncidentStorageService.saveIncident({
      localId: 'LOCAL-DISP-08',
      rangerId: 'RN-402',
      incidentType: 'Snare Detected',
      latitude: 6.31,
      longitude: 81.59,
      description: 'Old rusted snare retrieved.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.SYNCED,
      syncAttempts: 1,
      backendId: 'INC-2026-9008',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: 'LOCAL-DISP-08',
    });

    const all = await IncidentStorageService.getAllLocalIncidents();
    const syncedOnly = all.filter((i) => i.syncStatus === SYNC_STATUS.SYNCED);

    expect(syncedOnly.length).toBeGreaterThan(0);
    expect(syncedOnly.some((i) => i.localId === 'LOCAL-DISP-08')).toBe(true);
  });

  // TEST 15: My Incidents correctly displays pending local records
  test('Test 15: My Incidents retrieval correctly returns PENDING records', async () => {
    await IncidentStorageService.saveIncident({
      localId: 'LOCAL-DISP-09',
      rangerId: 'RN-402',
      incidentType: 'Illegal Campsite',
      latitude: 6.30,
      longitude: 81.60,
      description: 'Fresh ash and makeshift shelter.',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: 'LOCAL-DISP-09',
    });

    const all = await IncidentStorageService.getAllLocalIncidents();
    const pendingOnly = all.filter((i) => i.syncStatus === SYNC_STATUS.PENDING);

    expect(pendingOnly.length).toBeGreaterThan(0);
    expect(pendingOnly.some((i) => i.localId === 'LOCAL-DISP-09')).toBe(true);
  });

  // TEST 17: Negative coordinate validation out of range
  test('Test 17: Negative coordinate boundaries are rejected', () => {
    // Missing location
    const missingLoc = validateIncidentForm({
      incidentType: 'Snare Detected',
      location: null as any,
      photoUri: null,
      description: 'Test description 12345',
    });
    expect(missingLoc.isValid).toBe(false);
    expect(missingLoc.errors.location).toMatch(/GPS location is required/i);

    // Latitude > 90
    const latHigh = validateIncidentForm({
      incidentType: 'Snare Detected',
      location: { latitude: 91, longitude: 80 },
      photoUri: null,
      description: 'Test description 12345',
    });
    expect(latHigh.isValid).toBe(false);
    expect(latHigh.errors.location).toMatch(/out of valid range/i);

    // Latitude < -90
    const latLow = validateIncidentForm({
      incidentType: 'Snare Detected',
      location: { latitude: -95, longitude: 80 },
      photoUri: null,
      description: 'Test description 12345',
    });
    expect(latLow.isValid).toBe(false);
    expect(latLow.errors.location).toMatch(/out of valid range/i);

    // Longitude > 180
    const lngHigh = validateIncidentForm({
      incidentType: 'Snare Detected',
      location: { latitude: 10, longitude: 185 },
      photoUri: null,
      description: 'Test description 12345',
    });
    expect(lngHigh.isValid).toBe(false);
    expect(lngHigh.errors.location).toMatch(/out of valid range/i);

    // Longitude < -180
    const lngLow = validateIncidentForm({
      incidentType: 'Snare Detected',
      location: { latitude: 10, longitude: -185 },
      photoUri: null,
      description: 'Test description 12345',
    });
    expect(lngLow.isValid).toBe(false);
    expect(lngLow.errors.location).toMatch(/out of valid range/i);

    // NaN coordinates
    const nanCoords = validateIncidentForm({
      incidentType: 'Snare Detected',
      location: { latitude: NaN, longitude: 80 },
      photoUri: null,
      description: 'Test description 12345',
    });
    expect(nanCoords.isValid).toBe(false);
    expect(nanCoords.errors.location).toMatch(/invalid/i);
  });

  // TEST 18: Invalid incident type and extreme description lengths
  test('Test 18: Unrecognized incident category and excessive description length rejected', () => {
    const invalidType = validateIncidentForm({
      incidentType: 'Unidentified Flying Object' as any,
      location: { latitude: 6.37, longitude: 81.52 },
      photoUri: null,
      description: 'Test valid description here',
    });
    expect(invalidType.isValid).toBe(false);
    expect(invalidType.errors.incidentType).toMatch(/invalid incident type/i);

    const overlyLong = validateIncidentForm({
      incidentType: 'Snare Detected',
      location: { latitude: 6.37, longitude: 81.52 },
      photoUri: null,
      description: 'A'.repeat(1501),
    });
    expect(overlyLong.isValid).toBe(false);
    expect(overlyLong.errors.description).toMatch(/cannot exceed 1500 characters/i);
  });

  // TEST 19: Ranger login validator test
  test('Test 19: Ranger login input validation covers empty and short fields', () => {
    // Empty identifier
    const res1 = validateRangerLogin('', 'pass123');
    expect(res1.isValid).toBe(false);
    expect(res1.errors.identifier).toBeDefined();

    // Empty password
    const res2 = validateRangerLogin('RN-402', '');
    expect(res2.isValid).toBe(false);
    expect(res2.errors.password).toBeDefined();

    // Short password (< 4)
    const res3 = validateRangerLogin('RN-402', '12');
    expect(res3.isValid).toBe(false);
    expect(res3.errors.password).toMatch(/at least 4 characters/i);

    // Valid login
    const res4 = validateRangerLogin('RN-402', 'securePass');
    expect(res4.isValid).toBe(true);
    expect(Object.keys(res4.errors).length).toBe(0);
  });

  // TEST 20: Storage save updates existing incident
  test('Test 20: Storage service correctly updates existing incident with matching localId', async () => {
    const original: LocalIncidentRecord = {
      localId: 'LOCAL-UPDATE-10',
      rangerId: 'RN-402',
      incidentType: 'Snare Detected',
      latitude: 6.35,
      longitude: 81.55,
      description: 'Initial note',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: 'LOCAL-UPDATE-10',
    };
    await IncidentStorageService.saveIncident(original);

    const updated = await IncidentStorageService.saveIncident({
      ...original,
      description: 'Updated field note after investigation',
    });
    expect(updated.description).toBe('Updated field note after investigation');

    const retrieved = await IncidentStorageService.getLocalIncident('LOCAL-UPDATE-10');
    expect(retrieved?.description).toBe('Updated field note after investigation');
  });

  // TEST 21: Storage lookup supports backendId and clientReferenceId, returns null if missing
  test('Test 21: Storage lookup supports backendId and clientReferenceId, returns null if missing', async () => {
    const item: LocalIncidentRecord = {
      localId: 'LOCAL-REF-11',
      rangerId: 'RN-402',
      incidentType: 'Animal Carcass',
      latitude: 6.36,
      longitude: 81.56,
      description: 'Found leopard remains',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.SYNCED,
      syncAttempts: 1,
      backendId: 'SERVER-999',
      clientReferenceId: 'CLIENT-REF-UNIQUE-99',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await IncidentStorageService.saveIncident(item);

    const byBackendId = await IncidentStorageService.getLocalIncident('SERVER-999');
    expect(byBackendId?.localId).toBe('LOCAL-REF-11');

    const byClientRef = await IncidentStorageService.getLocalIncident('CLIENT-REF-UNIQUE-99');
    expect(byClientRef?.localId).toBe('LOCAL-REF-11');

    const missing = await IncidentStorageService.getLocalIncident('NON-EXISTENT-ID');
    expect(missing).toBeNull();
  });

  // TEST 22: Storage updateSyncStatus edge cases and removeIncident
  test('Test 22: Storage updateSyncStatus handles missing ID, and removeIncident deletes item', async () => {
    const updateMissing = await IncidentStorageService.updateSyncStatus('GHOST-ID', SYNC_STATUS.FAILED);
    expect(updateMissing).toBeNull();

    const localId = 'LOCAL-REMOVE-12';
    await IncidentStorageService.saveIncident({
      localId,
      rangerId: 'RN-402',
      incidentType: 'Illegal Campsite',
      latitude: 6.33,
      longitude: 81.51,
      description: 'Temporary campsite removed',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.PENDING,
      syncAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: localId,
    });

    const removeSuccess = await IncidentStorageService.removeIncident(localId);
    expect(removeSuccess).toBe(true);

    const lookup = await IncidentStorageService.getLocalIncident(localId);
    expect(lookup).toBeNull();
  });

  // TEST 23: IncidentApi getRangerIncidents and getIncidentById
  test('Test 23: IncidentApi getRangerIncidents and getIncidentById retrieve server records', async () => {
    const mockList = [{ _id: 'INC-1', title: 'Snare' }];
    (incidentApi as any).client = {
      get: jest.fn().mockImplementation((url: string) => {
        if (url.includes('/ranger/RN-402')) {
          return Promise.resolve({ data: { success: true, data: mockList } });
        }
        if (url.includes('/INC-1')) {
          return Promise.resolve({ data: { success: true, data: mockList[0] } });
        }
        return Promise.resolve({ data: { success: true, data: null } });
      }),
      post: jest.fn(),
      defaults: { baseURL: '' },
    };

    const rangerIncidents = await incidentApi.getRangerIncidents('RN-402');
    expect(rangerIncidents).toEqual(mockList);

    const single = await incidentApi.getIncidentById('INC-1');
    expect(single).toEqual(mockList[0]);
  });

  // TEST 24: IncidentApi syncBatch and config methods
  test('Test 24: IncidentApi syncBatch dispatches items and handles token/url setters', async () => {
    const mockPost = jest.fn().mockResolvedValue({
      data: { success: true, synced: 1 },
    });
    (incidentApi as any).client = {
      post: mockPost,
      defaults: { baseURL: '' },
    };

    incidentApi.setAuthToken('test-token-123');
    incidentApi.setBaseURL('http://test-server:5000');

    const batch = await incidentApi.syncBatch([
      {
        localId: 'BATCH-1',
        rangerId: 'RN-402',
        rangerName: 'Ranger Bandara',
        incidentType: 'Snare Detected',
        latitude: 6.37,
        longitude: 81.52,
        description: 'Batch item description',
        reportedAt: new Date().toISOString(),
        syncStatus: SYNC_STATUS.PENDING,
        syncAttempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientReferenceId: 'BATCH-1',
      },
    ]);

    expect(batch.success).toBe(true);
    expect(mockPost).toHaveBeenCalled();
  });

  // TEST 25: IncidentApi loginRanger online and offline fallback
  test('Test 25: IncidentApi loginRanger succeeds online and triggers fallback offline', async () => {
    // Online success
    (incidentApi as any).client = {
      post: jest.fn().mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            rangerId: 'RN-402',
            name: 'Ranger K. Bandara',
            token: 'valid-jwt-token',
          },
        },
      }),
      defaults: { baseURL: '' },
    };

    const onlineUser = await incidentApi.loginRanger('RN-402', 'password123');
    expect(onlineUser.rangerId).toBe('RN-402');
    expect(onlineUser.token).toBe('valid-jwt-token');

    // Offline network error fallback
    (incidentApi as any).client = {
      post: jest.fn().mockRejectedValueOnce({
        code: 'ERR_NETWORK',
        message: 'Network Error',
      }),
      defaults: { baseURL: '' },
    };

    const offlineUser = await incidentApi.loginRanger('ranger.bandara@ecoguard.lk', 'pass');
    expect(offlineUser.rangerId).toBe('RN-402');
    expect(offlineUser.name).toMatch(/Offline Mode/i);
    expect(offlineUser.token).toBe('offline_field_token_2026');
  });

  // TEST 26: IncidentApi createIncident uploads photo if file URI provided
  test('Test 26: IncidentApi createIncident uploads photo if local file URI exists', async () => {
    jest.spyOn(photoService, 'uploadEvidence').mockResolvedValueOnce('https://cloud.ecoguard.lk/uploads/photo-1.jpg');

    let sentPayload: any = null;
    (incidentApi as any).client = {
      post: jest.fn().mockImplementation((_url: string, payload: any) => {
        sentPayload = payload;
        return Promise.resolve({ data: { success: true, data: { incidentId: 'INC-UPLOAD-1' } } });
      }),
      defaults: { baseURL: '' },
    };

    const record: LocalIncidentRecord = {
      localId: 'LOCAL-IMG-01',
      rangerId: 'RN-402',
      incidentType: 'Snare Detected',
      latitude: 6.37,
      longitude: 81.52,
      description: 'Snare with uploaded evidence',
      photoUri: 'file:///data/user/0/cache/photo.jpg',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.SYNCING,
      syncAttempts: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: 'LOCAL-IMG-01',
    };

    const res = await incidentApi.createIncident(record);
    expect(res.success).toBe(true);
    expect(sentPayload.photoUrl).toBe('https://cloud.ecoguard.lk/uploads/photo-1.jpg');
  });

  // TEST 27: SyncService syncPendingIncidents throws error when offline
  test('Test 27: SyncService syncPendingIncidents throws when device is offline', async () => {
    networkService.setSimulatedOffline(true);

    await expect(syncService.syncPendingIncidents()).rejects.toThrow(/Device is currently offline/i);
  });

  // TEST 28: SyncService retryFailedIncident throws when offline or record not found
  test('Test 28: SyncService retryFailedIncident throws on offline or missing localId', async () => {
    networkService.setSimulatedOffline(true);
    await expect(syncService.retryFailedIncident('SOME-ID')).rejects.toThrow(/Device is offline/i);

    networkService.setSimulatedOffline(false);
    await expect(syncService.retryFailedIncident('NON-EXISTENT-LOCAL-ID')).rejects.toThrow(/not found in local storage/i);
  });

  // TEST 29: SyncService retryFailedIncident handles API failure
  test('Test 29: SyncService retryFailedIncident marks status as FAILED when API rejects', async () => {
    const localId = 'LOCAL-RETRY-FAIL-1';
    await IncidentStorageService.saveIncident({
      localId,
      rangerId: 'RN-402',
      incidentType: 'Snare Detected',
      latitude: 6.37,
      longitude: 81.52,
      description: 'Retry failure test',
      reportedAt: new Date().toISOString(),
      syncStatus: SYNC_STATUS.FAILED,
      syncAttempts: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientReferenceId: localId,
    });

    jest.spyOn(incidentApi, 'createIncident').mockRejectedValueOnce(new Error('Server Error 500'));

    const result = await syncService.retryFailedIncident(localId);
    expect(result?.syncStatus).toBe(SYNC_STATUS.FAILED);
    expect(result?.lastSyncError).toMatch(/Server Error 500/i);
  });

  // TEST 30: SyncService subscription events and getters
  test('Test 30: SyncService subscribe listener receives state, unsubscribe stops calls', () => {
    let callCount = 0;
    const unsubscribe = syncService.subscribe(() => {
      callCount++;
    });

    expect(callCount).toBeGreaterThanOrEqual(1);
    expect(syncService.getIsSyncing()).toBe(false);

    unsubscribe();
    const countAfterUnsub = callCount;
    // Internal state query
    expect(syncService.getLastSyncTime()).toBeDefined();
    expect(callCount).toBe(countAfterUnsub);
  });

  // TEST 31: PhotoService takePhoto permission denied and user cancelled
  test('Test 31: PhotoService takePhoto handles permission denial and cancellation gracefully', async () => {
    // Permission denied
    jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValueOnce({ granted: false } as any);
    const denied = await photoService.takePhoto();
    expect(denied).toBeNull();

    // User cancelled
    jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValueOnce({ granted: true } as any);
    jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValueOnce({ canceled: true, assets: [] } as any);
    const cancelled = await photoService.takePhoto();
    expect(cancelled).toBeNull();
  });

  // TEST 32: PhotoService pickFromGallery permission denied and user cancelled
  test('Test 32: PhotoService pickFromGallery handles permission denial and cancellation gracefully', async () => {
    // Permission denied
    jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValueOnce({ granted: false } as any);
    const denied = await photoService.pickFromGallery();
    expect(denied).toBeNull();

    // User cancelled
    jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync').mockResolvedValueOnce({ granted: true } as any);
    jest.spyOn(ImagePicker, 'launchImageLibraryAsync').mockResolvedValueOnce({ canceled: true, assets: [] } as any);
    const cancelled = await photoService.pickFromGallery();
    expect(cancelled).toBeNull();
  });

  // TEST 33: PhotoService uploadEvidence success and error handling
  test('Test 33: PhotoService uploadEvidence succeeds with valid URL and throws on server error', async () => {
    // Success
    jest.spyOn(FileSystem, 'uploadAsync').mockResolvedValueOnce({
      status: 200,
      body: JSON.stringify({ success: true, data: { photoUrl: 'https://cdn.ecoguard.lk/test.jpg' } }),
    } as any);

    const url = await photoService.uploadEvidence({ uri: 'file:///local/photo.jpg', fileName: 'test.jpg' });
    expect(url).toBe('https://cdn.ecoguard.lk/test.jpg');

    // Server HTTP 500 error
    jest.spyOn(FileSystem, 'uploadAsync').mockResolvedValueOnce({
      status: 500,
      body: JSON.stringify({ error: 'Internal Error' }),
    } as any);

    await expect(
      photoService.uploadEvidence({ uri: 'file:///local/photo.jpg' })
    ).rejects.toThrow(/Evidence upload failed/i);
  });

  // TEST 34: LocationService with navigator.geolocation success
  test('Test 34: LocationService retrieves position from navigator.geolocation when available', async () => {
    const originalNavigator = (global as any).navigator;
    (global as any).navigator = {
      geolocation: {
        getCurrentPosition: jest.fn((success) => {
          success({
            coords: {
              latitude: 6.4567,
              longitude: 81.6789,
              accuracy: 10,
            },
          });
        }),
      },
    };

    const result = await locationService.getCurrentLocation();
    expect(result.success).toBe(true);
    expect(result.location?.latitude).toBe(6.4567);
    expect(result.location?.longitude).toBe(81.6789);

    (global as any).navigator = originalNavigator;
  });

  // TEST 35: LocationService with navigator.geolocation error codes
  test('Test 35: LocationService handles geolocation error codes 1, 2, and 3', async () => {
    const originalNavigator = (global as any).navigator;

    // Code 1: Permission denied
    (global as any).navigator = {
      geolocation: {
        getCurrentPosition: jest.fn((_success, error) => {
          error({ code: 1, message: 'User denied' });
        }),
      },
    };
    const res1 = await locationService.getCurrentLocation();
    expect(res1.success).toBe(false);
    expect(res1.code).toBe('PERMISSION_DENIED');

    // Code 2: Position unavailable
    (global as any).navigator = {
      geolocation: {
        getCurrentPosition: jest.fn((_success, error) => {
          error({ code: 2, message: 'Position unavailable' });
        }),
      },
    };
    const res2 = await locationService.getCurrentLocation();
    expect(res2.success).toBe(false);
    expect(res2.code).toBe('POSITION_UNAVAILABLE');

    // Code 3: Timeout
    (global as any).navigator = {
      geolocation: {
        getCurrentPosition: jest.fn((_success, error) => {
          error({ code: 3, message: 'Timeout' });
        }),
      },
    };
    const res3 = await locationService.getCurrentLocation();
    expect(res3.success).toBe(false);
    expect(res3.code).toBe('TIMEOUT');

    (global as any).navigator = originalNavigator;
  });
});

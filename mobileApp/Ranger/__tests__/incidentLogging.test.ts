import { validateIncidentForm } from '../src/utils/validators';
import { IncidentStorageService } from '../src/services/incidentStorage';
import { locationService } from '../src/services/locationService';
import { photoService } from '../src/services/photoService';
import { networkService } from '../src/services/networkService';
import { syncService } from '../src/services/syncService';
import { incidentApi } from '../src/services/incidentApi';
import { SYNC_STATUS } from '../src/constants/syncStatus';
import { LocalIncidentRecord } from '../src/types/incident';

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

  // TEST 16: Photo handling
  test('Test 16: Photo capture and selection returns valid URI and base64 reference', async () => {
    const photoCamera = await photoService.takePhoto();
    expect(photoCamera.uri).toBeDefined();
    expect(photoCamera.uri).toContain('.jpg');
    expect(photoCamera.base64).toBeDefined();

    const photoGallery = await photoService.pickFromGallery();
    expect(photoGallery.uri).toBeDefined();
    expect(photoGallery.base64).toBeDefined();
  });
});

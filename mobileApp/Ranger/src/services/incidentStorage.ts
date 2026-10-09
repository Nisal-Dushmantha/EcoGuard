import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalIncidentRecord } from '../types/incident';
import { SyncStatus, SYNC_STATUS } from '../constants/syncStatus';

const STORAGE_KEYS = {
  INCIDENTS: '@ecoguard_ranger_incidents_v1',
  AUTH_USER: '@ecoguard_ranger_user_v1',
};

// In-memory fallback map to support zero-failure execution in Jest/emulators
const memoryFallbackMap = new Map<string, LocalIncidentRecord>();

export class IncidentStorageService {
  /**
   * Safe getter for AsyncStorage with memory fallback
   */
  private static async getRawList(): Promise<LocalIncidentRecord[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.INCIDENTS);
      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) {
          // Sync with memory cache
          parsed.forEach((item) => memoryFallbackMap.set(item.localId, item));
          return parsed;
        }
      }
    } catch {
      // AsyncStorage may fail in non-native test environments
    }
    return Array.from(memoryFallbackMap.values());
  }

  /**
   * Safe setter for AsyncStorage with memory fallback
   */
  private static async setRawList(list: LocalIncidentRecord[]): Promise<void> {
    // Update memory cache
    memoryFallbackMap.clear();
    list.forEach((item) => memoryFallbackMap.set(item.localId, item));

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(list));
    } catch {
      // Retained in memory fallback
    }
  }

  /**
   * Save an incident locally (creates new or updates existing)
   */
  static async saveIncident(incident: LocalIncidentRecord): Promise<LocalIncidentRecord> {
    const list = await this.getRawList();
    const existingIndex = list.findIndex((item) => item.localId === incident.localId);

    const updatedIncident: LocalIncidentRecord = {
      ...incident,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedIncident;
    } else {
      list.unshift(updatedIncident);
    }

    await this.setRawList(list);
    return updatedIncident;
  }

  /**
   * Retrieve all local incidents sorted by report date descending
   */
  static async getAllLocalIncidents(): Promise<LocalIncidentRecord[]> {
    const list = await this.getRawList();
    return list.sort(
      (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }

  /**
   * Retrieve all pending synchronization incidents
   */
  static async getPendingIncidents(): Promise<LocalIncidentRecord[]> {
    const list = await this.getRawList();
    return list.filter(
      (item) => item.syncStatus === SYNC_STATUS.PENDING || item.syncStatus === SYNC_STATUS.FAILED
    );
  }

  /**
   * Retrieve an incident by its local ID or backend ID
   */
  static async getLocalIncident(id: string): Promise<LocalIncidentRecord | null> {
    const list = await this.getRawList();
    return (
      list.find((item) => item.localId === id || item.backendId === id || item.clientReferenceId === id) ||
      null
    );
  }

  /**
   * Update the sync status of an incident
   */
  static async updateSyncStatus(
    localId: string,
    status: SyncStatus,
    error?: string,
    backendData?: { backendId?: string }
  ): Promise<LocalIncidentRecord | null> {
    const list = await this.getRawList();
    const index = list.findIndex((item) => item.localId === localId);
    if (index === -1) return null;

    const current = list[index];
    const updated: LocalIncidentRecord = {
      ...current,
      syncStatus: status,
      syncAttempts: status === SYNC_STATUS.SYNCING ? current.syncAttempts + 1 : current.syncAttempts,
      lastSyncError: error !== undefined ? error : current.lastSyncError,
      backendId: backendData?.backendId || current.backendId,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    await this.setRawList(list);
    return updated;
  }

  /**
   * Remove an incident from local storage
   */
  static async removeIncident(localId: string): Promise<boolean> {
    const list = await this.getRawList();
    const filtered = list.filter((item) => item.localId !== localId);
    await this.setRawList(filtered);
    return true;
  }

  /**
   * Clear all records (useful for testing or profile change)
   */
  static async clearAllLocalIncidents(): Promise<void> {
    memoryFallbackMap.clear();
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.INCIDENTS);
    } catch {
      // Handled
    }
  }
}

export default IncidentStorageService;

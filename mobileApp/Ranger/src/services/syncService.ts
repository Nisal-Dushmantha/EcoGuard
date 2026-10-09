import { IncidentStorageService } from './incidentStorage';
import { incidentApi } from './incidentApi';
import { networkService } from './networkService';
import { SYNC_STATUS } from '../constants/syncStatus';
import { LocalIncidentRecord } from '../types/incident';

export type SyncEventCallback = (event: {
  isSyncing: boolean;
  syncedCount: number;
  failedCount: number;
  lastSyncTime: Date | null;
}) => void;

class SyncService {
  private isSyncing: boolean = false;
  private lastSyncTime: Date | null = null;
  private subscribers: Set<SyncEventCallback> = new Set();

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    // When internet connection returns, automatically attempt synchronization
    networkService.subscribe((isConnected) => {
      if (isConnected) {
        this.syncPendingIncidents().catch((err) => {
          console.warn('Auto-sync on network reconnect failed:', err);
        });
      }
    });
  }

  public subscribe(callback: SyncEventCallback): () => void {
    this.subscribers.add(callback);
    callback({
      isSyncing: this.isSyncing,
      syncedCount: 0,
      failedCount: 0,
      lastSyncTime: this.lastSyncTime,
    });
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(syncedCount: number = 0, failedCount: number = 0) {
    this.subscribers.forEach((cb) => {
      try {
        cb({
          isSyncing: this.isSyncing,
          syncedCount,
          failedCount,
          lastSyncTime: this.lastSyncTime,
        });
      } catch (err) {
        console.error('Error notifying sync listener:', err);
      }
    });
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Synchronize all pending or failed incidents with the backend
   */
  async syncPendingIncidents(): Promise<{ synced: number; failed: number; total: number }> {
    const { isConnected } = networkService.getStatus();
    if (!isConnected) {
      throw new Error('Device is currently offline. Cannot synchronize.');
    }

    if (this.isSyncing) {
      return { synced: 0, failed: 0, total: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let syncedCount = 0;
    let failedCount = 0;

    try {
      const pendingItems = await IncidentStorageService.getPendingIncidents();

      for (const item of pendingItems) {
        try {
          // Mark as currently syncing
          await IncidentStorageService.updateSyncStatus(item.localId, SYNC_STATUS.SYNCING);

          const result = await incidentApi.createIncident(item);

          if (result && result.success) {
            const backendId = result.data?.incidentId || result.data?._id;
            await IncidentStorageService.updateSyncStatus(
              item.localId,
              SYNC_STATUS.SYNCED,
              undefined,
              { backendId }
            );
            syncedCount++;
          } else {
            throw new Error(result?.message || 'Sync rejected by server');
          }
        } catch (err: any) {
          failedCount++;
          const errorMessage = err.response?.data?.message || err.message || 'Network error during sync';
          await IncidentStorageService.updateSyncStatus(
            item.localId,
            SYNC_STATUS.FAILED,
            errorMessage
          );
        }
      }

      this.lastSyncTime = new Date();
      return { synced: syncedCount, failed: failedCount, total: pendingItems.length };
    } finally {
      this.isSyncing = false;
      this.notify(syncedCount, failedCount);
    }
  }

  /**
   * Retry synchronization for a specific failed incident
   */
  async retryFailedIncident(localId: string): Promise<LocalIncidentRecord | null> {
    const { isConnected } = networkService.getStatus();
    if (!isConnected) {
      throw new Error('Device is offline. Connect to the internet to retry synchronization.');
    }

    const item = await IncidentStorageService.getLocalIncident(localId);
    if (!item) {
      throw new Error('Incident not found in local storage.');
    }

    await IncidentStorageService.updateSyncStatus(localId, SYNC_STATUS.SYNCING);
    this.notify();

    try {
      const result = await incidentApi.createIncident(item);
      if (result && result.success) {
        const backendId = result.data?.incidentId || result.data?._id;
        const updated = await IncidentStorageService.updateSyncStatus(
          localId,
          SYNC_STATUS.SYNCED,
          undefined,
          { backendId }
        );
        this.notify(1, 0);
        return updated;
      }
      throw new Error(result?.message || 'Failed to sync');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Retry failed';
      const updated = await IncidentStorageService.updateSyncStatus(
        localId,
        SYNC_STATUS.FAILED,
        errorMessage
      );
      this.notify(0, 1);
      return updated;
    }
  }
}

export const syncService = new SyncService();
export default syncService;

import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';
import { IncidentStorageService } from '../services/incidentStorage';
import { LocalIncidentRecord } from '../types/incident';

export const useIncidentSync = () => {
  const [isSyncing, setIsSyncing] = useState<boolean>(() => syncService.getIsSyncing());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => syncService.getLastSyncTime());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const refreshCounts = useCallback(async () => {
    try {
      const pending = await IncidentStorageService.getPendingIncidents();
      setPendingCount(pending.length);
    } catch {
      // Handled
    }
  }, []);

  useEffect(() => {
    refreshCounts();

    const unsubscribe = syncService.subscribe((event) => {
      setIsSyncing(event.isSyncing);
      setLastSyncTime(event.lastSyncTime);
      refreshCounts();

      if (!event.isSyncing && (event.syncedCount > 0 || event.failedCount > 0)) {
        setSyncFeedback(
          `Sync completed: ${event.syncedCount} synced successfully${
            event.failedCount > 0 ? `, ${event.failedCount} failed` : ''
          }.`
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshCounts]);

  const triggerSync = useCallback(async () => {
    setSyncFeedback(null);
    try {
      const res = await syncService.syncPendingIncidents();
      await refreshCounts();
      return res;
    } catch (err: any) {
      setSyncFeedback(err.message || 'Sync failed');
      throw err;
    }
  }, [refreshCounts]);

  const retryIncident = useCallback(async (localId: string) => {
    setSyncFeedback(null);
    try {
      const res = await syncService.retryFailedIncident(localId);
      await refreshCounts();
      return res;
    } catch (err: any) {
      setSyncFeedback(err.message || 'Retry failed');
      throw err;
    }
  }, [refreshCounts]);

  return {
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncFeedback,
    triggerSync,
    retryIncident,
    refreshCounts,
  };
};

export default useIncidentSync;

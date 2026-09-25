export const SYNC_STATUS = {
  SYNCED: 'SYNCED',
  PENDING: 'PENDING',
  SYNCING: 'SYNCING',
  FAILED: 'FAILED',
} as const;

export type SyncStatus = typeof SYNC_STATUS[keyof typeof SYNC_STATUS];

export interface SyncStatusBadgeConfig {
  label: string;
  badgeText: string;
  accessibleName: string;
  colorKey: 'synced' | 'pending' | 'syncing' | 'failed';
  icon: string;
}

export const SYNC_STATUS_CONFIG: Record<SyncStatus, SyncStatusBadgeConfig> = {
  SYNCED: {
    label: 'Synced',
    badgeText: 'SYNCED',
    accessibleName: 'Synchronized with EcoGuard servers',
    colorKey: 'synced',
    icon: '✓',
  },
  PENDING: {
    label: 'Pending Sync',
    badgeText: 'PENDING SYNC',
    accessibleName: 'Pending synchronization. Saved safely on device.',
    colorKey: 'pending',
    icon: '⏳',
  },
  SYNCING: {
    label: 'Syncing',
    badgeText: 'SYNCING...',
    accessibleName: 'Currently uploading to EcoGuard servers',
    colorKey: 'syncing',
    icon: '🔄',
  },
  FAILED: {
    label: 'Sync Failed',
    badgeText: 'SYNC FAILED',
    accessibleName: 'Synchronization failed. Tap to retry.',
    colorKey: 'failed',
    icon: '⚠',
  },
};

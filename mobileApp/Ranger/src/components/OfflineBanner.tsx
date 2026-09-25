import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useIncidentSync } from '../hooks/useIncidentSync';

interface OfflineBannerProps {
  onViewPending?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onViewPending }) => {
  const { isConnected } = useNetworkStatus();
  const { pendingCount, isSyncing } = useIncidentSync();

  if (isConnected && pendingCount === 0) {
    return null; // All is online and synced, banner not needed
  }

  const isOffline = !isConnected;

  return (
    <View
      style={[
        styles.banner,
        isOffline ? styles.bannerOffline : styles.bannerPending,
      ]}
      accessible={true}
      accessibilityRole="alert"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{isOffline ? '📡' : '⏳'}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isOffline ? 'Offline Mode Active' : isSyncing ? 'Synchronizing...' : 'Pending Records'}
          </Text>
          <Text style={styles.description}>
            {isOffline
              ? pendingCount > 0
                ? `${pendingCount} incident${pendingCount > 1 ? 's' : ''} stored locally and waiting to sync.`
                : 'Field reports will be safely stored on device until network returns.'
              : `${pendingCount} incident${pendingCount > 1 ? 's' : ''} ready to sync with central server.`}
          </Text>
        </View>

        {onViewPending && pendingCount > 0 ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onViewPending}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View pending incidents"
          >
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: THEME.spacing.base,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
  },
  bannerOffline: {
    backgroundColor: '#FEF3C7',
    borderBottomColor: '#F59E0B',
  },
  bannerPending: {
    backgroundColor: '#EFF6FF',
    borderBottomColor: '#93C5FD',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: 20,
    marginRight: THEME.spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.typography.sm,
    fontWeight: '700',
    color: '#92400E',
  },
  description: {
    fontSize: THEME.typography.xs,
    color: '#78350F',
    marginTop: 1,
  },
  actionButton: {
    backgroundColor: '#92400E',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: THEME.typography.xs,
    fontWeight: '700',
  },
});

export default OfflineBanner;

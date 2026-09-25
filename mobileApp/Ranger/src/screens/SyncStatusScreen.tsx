import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { THEME } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { StatusBadge } from '../components/StatusBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { LocalIncidentRecord } from '../types/incident';
import { SYNC_STATUS } from '../constants/syncStatus';
import { INCIDENT_TYPE_METADATA } from '../constants/incidentTypes';
import { formatDateTime } from '../utils/helpers';
import { IncidentStorageService } from '../services/incidentStorage';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useIncidentSync } from '../hooks/useIncidentSync';

interface SyncStatusScreenProps {
  navigation: any;
}

export const SyncStatusScreen: React.FC<SyncStatusScreenProps> = ({ navigation }) => {
  const { isConnected, isSimulatedOffline, toggleSimulation } = useNetworkStatus();
  const { isSyncing, triggerSync, retryIncident, refreshCounts } = useIncidentSync();

  const [pendingItems, setPendingItems] = useState<LocalIncidentRecord[]>([]);
  const [syncedCount, setSyncedCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const all = await IncidentStorageService.getAllLocalIncidents();
      const synced = all.filter((i) => i.syncStatus === SYNC_STATUS.SYNCED);
      const pending = all.filter((i) => i.syncStatus === SYNC_STATUS.PENDING);
      const failed = all.filter((i) => i.syncStatus === SYNC_STATUS.FAILED);

      setSyncedCount(synced.length);
      setPendingCount(pending.length);
      setFailedCount(failed.length);
      setPendingItems([...pending, ...failed]);
      await refreshCounts();
    } catch (err) {
      console.error('Failed to load sync data:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshCounts]);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const handleManualSync = async () => {
    if (!isConnected) {
      Alert.alert('Offline Mode', 'Connect to the internet to synchronize pending incidents.');
      return;
    }

    setSyncMessage(null);
    try {
      const result = await triggerSync();
      setSyncMessage(
        `Synchronization complete: ${result.synced} incidents uploaded successfully.`
      );
      await loadData();
    } catch (err: any) {
      setSyncMessage(`Synchronization encountered errors: ${err.message}`);
      await loadData();
    }
  };

  const handleRetrySingle = async (localId: string) => {
    if (!isConnected) {
      Alert.alert('Offline Mode', 'Connect to the internet to synchronize.');
      return;
    }

    try {
      await retryIncident(localId);
      await loadData();
    } catch (err: any) {
      Alert.alert('Retry Failed', err.message || 'Unable to sync incident.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Synchronization"
        subtitle="Offline Data Queue"
        onBack={() => navigation.goBack()}
        showConnectivity={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Connection State Card */}
        <View
          style={[
            styles.statusBanner,
            isConnected ? styles.statusBannerOnline : styles.statusBannerOffline,
          ]}
        >
          <Text style={styles.statusBannerIcon}>{isConnected ? '🌐' : '📡'}</Text>
          <View style={styles.statusBannerTextGroup}>
            <Text style={styles.statusBannerTitle}>
              {isConnected ? 'Device Online' : 'Device Offline'}
            </Text>
            <Text style={styles.statusBannerSub}>
              {isConnected
                ? 'Central server reachable. Incidents can be synchronized.'
                : 'Connect to cellular data or Wi-Fi to synchronize pending field incidents.'}
            </Text>
          </View>
        </View>

        {/* Sync Status Counters Metric Grid */}
        <View style={styles.metricsRow}>
          {/* Synced */}
          <View style={[styles.metricBox, styles.metricSynced]}>
            <Text style={[styles.metricNumber, { color: THEME.colors.status.synced.text }]}>
              {syncedCount}
            </Text>
            <Text style={styles.metricLabel}>Synced</Text>
          </View>

          {/* Pending */}
          <View style={[styles.metricBox, styles.metricPending]}>
            <Text style={[styles.metricNumber, { color: THEME.colors.status.pending.text }]}>
              {pendingCount}
            </Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>

          {/* Failed */}
          <View style={[styles.metricBox, styles.metricFailed]}>
            <Text style={[styles.metricNumber, { color: THEME.colors.status.failed.text }]}>
              {failedCount}
            </Text>
            <Text style={styles.metricLabel}>Failed</Text>
          </View>
        </View>

        {/* Sync Action Button */}
        <View style={styles.actionContainer}>
          <PrimaryButton
            title={isSyncing ? 'Synchronizing Queue...' : 'Sync Now'}
            onPress={handleManualSync}
            disabled={!isConnected || isSyncing || (pendingCount === 0 && failedCount === 0)}
            loading={isSyncing}
            icon={isSyncing ? undefined : '🔄'}
          />

          {!isConnected ? (
            <Text style={styles.disabledReason}>
              Connect to the internet to synchronize pending incidents.
            </Text>
          ) : pendingCount === 0 && failedCount === 0 ? (
            <Text style={styles.allSyncedText}>All recorded incidents are currently up to date.</Text>
          ) : null}

          {syncMessage ? (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>{syncMessage}</Text>
            </View>
          ) : null}
        </View>

        {/* SECTION: PENDING INCIDENTS QUEUE */}
        <Text style={styles.queueHeader}>
          Pending Incident Queue ({pendingItems.length})
        </Text>

        {loading ? (
          <ActivityIndicator color={THEME.colors.primary} size="small" />
        ) : pendingItems.length === 0 ? (
          <View style={styles.emptyQueueBox}>
            <Text style={styles.emptyQueueIcon}>✓</Text>
            <Text style={styles.emptyQueueTitle}>No pending records</Text>
            <Text style={styles.emptyQueueSub}>
              All offline field incident records have been safely synchronized with EcoGuard central servers.
            </Text>
          </View>
        ) : (
          pendingItems.map((item) => {
            const meta = INCIDENT_TYPE_METADATA[item.incidentType] || { icon: '📋' };
            const isFailed = item.syncStatus === SYNC_STATUS.FAILED;

            return (
              <View
                key={item.localId}
                style={[styles.queueItem, isFailed && styles.queueItemFailed]}
              >
                <View style={styles.queueItemTop}>
                  <Text style={styles.queueIcon}>{meta.icon}</Text>
                  <View style={styles.queueTextGroup}>
                    <Text style={styles.queueType}>{item.incidentType}</Text>
                    <Text style={styles.queueTime}>{formatDateTime(item.reportedAt)}</Text>
                    <Text style={styles.queueId}>Ref: {item.localId}</Text>
                  </View>
                  <StatusBadge status={item.syncStatus} size="sm" />
                </View>

                {isFailed && item.lastSyncError ? (
                  <Text style={styles.errorSnippet}>Reason: {item.lastSyncError}</Text>
                ) : null}

                <View style={styles.queueActions}>
                  <TouchableOpacity
                    style={styles.detailsLink}
                    onPress={() =>
                      navigation.navigate('IncidentDetails', {
                        incidentId: item.localId,
                        incident: item,
                      })
                    }
                  >
                    <Text style={styles.detailsLinkText}>View Report</Text>
                  </TouchableOpacity>

                  {isFailed ? (
                    <TouchableOpacity
                      style={styles.retrySingleBtn}
                      onPress={() => handleRetrySingle(item.localId)}
                      disabled={!isConnected}
                    >
                      <Text style={styles.retrySingleText}>Retry</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        {/* Demo Simulation Button */}
        <View style={styles.simulationBox}>
          <Text style={styles.simulationTitle}>Academic Evaluation / Field Simulator</Text>
          <Text style={styles.simulationSub}>
            Simulate cellular signal loss to test offline queuing and auto-reconnect synchronization.
          </Text>
          <SecondaryButton
            title={isSimulatedOffline ? 'Restore Online Network' : 'Simulate Offline Mode'}
            onPress={toggleSimulation}
            icon={isSimulatedOffline ? '🌐' : '📡'}
            style={styles.simBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.base,
    paddingBottom: THEME.spacing.xxl,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.base,
    borderRadius: THEME.radius.lg,
    borderWidth: 1.5,
    marginBottom: THEME.spacing.base,
  },
  statusBannerOnline: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  statusBannerOffline: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  statusBannerIcon: {
    fontSize: 28,
    marginRight: THEME.spacing.md,
  },
  statusBannerTextGroup: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: THEME.typography.base,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  statusBannerSub: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  metricBox: {
    flex: 1,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  metricSynced: {
    backgroundColor: THEME.colors.status.synced.bg,
    borderColor: THEME.colors.status.synced.border,
  },
  metricPending: {
    backgroundColor: THEME.colors.status.pending.bg,
    borderColor: THEME.colors.status.pending.border,
  },
  metricFailed: {
    backgroundColor: THEME.colors.status.failed.bg,
    borderColor: THEME.colors.status.failed.border,
  },
  metricNumber: {
    fontSize: THEME.typography.xxl,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  actionContainer: {
    marginBottom: THEME.spacing.xl,
  },
  disabledReason: {
    textAlign: 'center',
    fontSize: THEME.typography.xs,
    color: THEME.colors.warning,
    marginTop: THEME.spacing.sm,
    fontWeight: '600',
  },
  allSyncedText: {
    textAlign: 'center',
    fontSize: THEME.typography.xs,
    color: THEME.colors.primary,
    marginTop: THEME.spacing.sm,
    fontWeight: '600',
  },
  feedbackBox: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.sm,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  feedbackText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  queueHeader: {
    fontSize: THEME.typography.sm,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.sm,
  },
  emptyQueueBox: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xl,
  },
  emptyQueueIcon: {
    fontSize: 32,
    color: THEME.colors.accent,
    marginBottom: THEME.spacing.sm,
    fontWeight: 'bold',
  },
  emptyQueueTitle: {
    fontSize: THEME.typography.base,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  emptyQueueSub: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  queueItem: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.sm,
  },
  queueItemFailed: {
    borderColor: THEME.colors.error,
    backgroundColor: '#FFFDFD',
  },
  queueItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueIcon: {
    fontSize: 24,
    marginRight: THEME.spacing.sm,
  },
  queueTextGroup: {
    flex: 1,
  },
  queueType: {
    fontSize: THEME.typography.sm,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  queueTime: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  queueId: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontFamily: 'monospace',
  },
  errorSnippet: {
    fontSize: 11,
    color: THEME.colors.error,
    marginTop: 4,
    fontWeight: '600',
  },
  queueActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
    gap: THEME.spacing.md,
  },
  detailsLink: {
    paddingVertical: 4,
  },
  detailsLinkText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  retrySingleBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: THEME.radius.xs,
  },
  retrySingleText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.error,
    fontWeight: '700',
  },
  simulationBox: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.base,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginTop: THEME.spacing.lg,
  },
  simulationTitle: {
    fontSize: THEME.typography.xs,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textTransform: 'uppercase',
  },
  simulationSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: THEME.spacing.md,
    lineHeight: 16,
  },
  simBtn: {
    backgroundColor: THEME.colors.surface,
  },
});

export default SyncStatusScreen;

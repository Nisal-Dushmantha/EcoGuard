import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { THEME } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { OfflineBanner } from '../components/OfflineBanner';
import { getGreetingByTime } from '../utils/helpers';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useIncidentSync } from '../hooks/useIncidentSync';
import { IncidentStorageService } from '../services/incidentStorage';

interface RangerDashboardScreenProps {
  navigation: any;
}

export const RangerDashboardScreen: React.FC<RangerDashboardScreenProps> = ({ navigation }) => {
  const { isConnected } = useNetworkStatus();
  const { pendingCount, isSyncing, triggerSync, refreshCounts } = useIncidentSync();
  const [totalIncidentsCount, setTotalIncidentsCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const all = await IncidentStorageService.getAllLocalIncidents();
      setTotalIncidentsCount(all.length);
      await refreshCounts();
    } catch {
      // Handled
    }
  }, [refreshCounts]);

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });
    return unsubscribe;
  }, [navigation, loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    if (isConnected && pendingCount > 0) {
      try {
        await triggerSync();
      } catch {
        // Handled
      }
    }
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="EcoGuard"
        subtitle={getGreetingByTime()}
        showConnectivity={true}
      />

      <OfflineBanner onViewPending={() => navigation.navigate('SyncStatus')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.colors.primary]}
          />
        }
      >
        {/* Ranger Profile Status Strip */}
        <View style={styles.rangerStrip}>
          <View style={styles.rangerAvatar}>
            <Text style={styles.avatarText}>RN</Text>
          </View>
          <View style={styles.rangerInfo}>
            <Text style={styles.rangerName}>Ranger K. Bandara</Text>
            <Text style={styles.rangerMeta}>Yala National Park • Sector 4</Text>
          </View>
          <View style={styles.badgeNumber}>
            <Text style={styles.badgeNumberText}>RN-402</Text>
          </View>
        </View>

        {/* PRIMARY ACTION CARD: LOG INCIDENT (Dominant Call to Action) */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Log New Field Incident. Report wildlife or anti-poaching activity."
          activeOpacity={0.88}
          style={styles.primaryActionCard}
          onPress={() => navigation.navigate('LogIncident')}
        >
          <View style={styles.primaryCardGlow} />
          <View style={styles.primaryCardContent}>
            <View style={styles.primaryIconBox}>
              <Text style={styles.primaryIcon}>＋</Text>
            </View>
            <View style={styles.primaryTextContainer}>
              <Text style={styles.primaryTag}>CRITICAL FIELD ACTION</Text>
              <Text style={styles.primaryTitle}>Log New Incident</Text>
              <Text style={styles.primarySub}>
                Report snare, animal carcass, poachers, or wildlife threat
              </Text>
            </View>
          </View>

          <View style={styles.primaryFooter}>
            <Text style={styles.primaryFooterText}>
              {isConnected ? '⚡ Instant Server Upload' : '💾 Safe Offline Storage'}
            </Text>
            <Text style={styles.primaryArrow}>Start Report →</Text>
          </View>
        </TouchableOpacity>

        {/* SECTION: SUMMARY & SECONDARY METRICS */}
        <Text style={styles.sectionHeader}>Operations Overview</Text>

        <View style={styles.metricGrid}>
          {/* My Incidents Card */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`My incidents: ${totalIncidentsCount} recorded reports`}
            activeOpacity={0.8}
            style={styles.metricCard}
            onPress={() => navigation.navigate('IncidentsTab')}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricIcon}>📋</Text>
              <Text style={styles.metricCount}>{totalIncidentsCount}</Text>
            </View>
            <Text style={styles.metricTitle}>My Incidents</Text>
            <Text style={styles.metricSub}>Recorded reports</Text>
          </TouchableOpacity>

          {/* Alerts Card */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Active field alerts: 2 active notices"
            activeOpacity={0.8}
            style={styles.metricCard}
            onPress={() => navigation.navigate('AlertsTab')}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricIcon}>🔔</Text>
              <View style={styles.activeAlertDot} />
              <Text style={styles.metricCount}>2</Text>
            </View>
            <Text style={styles.metricTitle}>Field Alerts</Text>
            <Text style={styles.metricSub}>Patrol advisories</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION: SYNCHRONIZATION STATUS CARD */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Synchronization status: ${
            pendingCount === 0 ? 'All data synchronized' : `${pendingCount} records waiting`
          }`}
          activeOpacity={0.8}
          style={[styles.syncCard, pendingCount > 0 && styles.syncCardPending]}
          onPress={() => navigation.navigate('SyncStatus')}
        >
          <View style={styles.syncCardHeader}>
            <View style={styles.syncTitleGroup}>
              <Text style={styles.syncIcon}>{pendingCount > 0 ? '⏳' : '✓'}</Text>
              <View>
                <Text style={styles.syncTitle}>Data Synchronization</Text>
                <Text style={styles.syncSub}>
                  {isSyncing
                    ? 'Synchronizing records with EcoGuard cloud...'
                    : pendingCount === 0
                    ? 'All field records are synchronized'
                    : `${pendingCount} incident${pendingCount > 1 ? 's' : ''} stored locally`}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.syncBadge,
                pendingCount > 0 ? styles.syncBadgePending : styles.syncBadgeSynced,
              ]}
            >
              <Text
                style={[
                  styles.syncBadgeText,
                  pendingCount > 0 ? styles.syncBadgeTextPending : styles.syncBadgeTextSynced,
                ]}
              >
                {isSyncing ? 'SYNCING' : pendingCount > 0 ? `${pendingCount} PENDING` : 'SYNCED'}
              </Text>
            </View>
          </View>

          <View style={styles.syncCardFooter}>
            <Text style={styles.syncFooterHint}>
              {isConnected
                ? 'Connected to EcoGuard central network'
                : 'Offline mode • Changes safely preserved'}
            </Text>
            <Text style={styles.syncDetailsLink}>View Details →</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Patrol Guide */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            GPS accuracy improves under open sky. Keep camera ready for photographic evidence.
          </Text>
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
  rangerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.base,
  },
  rangerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  avatarText: {
    color: THEME.colors.textInverse,
    fontWeight: '800',
    fontSize: THEME.typography.sm,
  },
  rangerInfo: {
    flex: 1,
  },
  rangerName: {
    fontSize: THEME.typography.base,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  rangerMeta: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  badgeNumber: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.xs,
  },
  badgeNumberText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  primaryActionCard: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: THEME.colors.primaryLight,
  },
  primaryCardGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: THEME.colors.primaryLight,
    borderTopRightRadius: THEME.radius.xl,
    borderBottomLeftRadius: 100,
    opacity: 0.2,
  },
  primaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  primaryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  primaryIcon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.colors.textInverse,
  },
  primaryTextContainer: {
    flex: 1,
  },
  primaryTag: {
    fontSize: 10,
    color: THEME.colors.accentLight,
    fontWeight: '800',
    letterSpacing: 1,
  },
  primaryTitle: {
    fontSize: THEME.typography.xl,
    fontWeight: '900',
    color: THEME.colors.textInverse,
    marginTop: 2,
  },
  primarySub: {
    fontSize: THEME.typography.xs,
    color: '#D1E7DD',
    marginTop: 2,
  },
  primaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: THEME.spacing.sm,
  },
  primaryFooterText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.accentLight,
    fontWeight: '600',
  },
  primaryArrow: {
    fontSize: THEME.typography.sm,
    fontWeight: '800',
    color: THEME.colors.textInverse,
  },
  sectionHeader: {
    fontSize: THEME.typography.sm,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.sm,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.base,
  },
  metricCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.base,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  metricIcon: {
    fontSize: 24,
  },
  activeAlertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.error,
  },
  metricCount: {
    fontSize: THEME.typography.xxl,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
  },
  metricTitle: {
    fontSize: THEME.typography.sm,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  metricSub: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  syncCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.base,
    borderWidth: 1.5,
    borderColor: THEME.colors.status.synced.border,
    marginBottom: THEME.spacing.base,
  },
  syncCardPending: {
    borderColor: THEME.colors.status.pending.border,
    backgroundColor: '#FFFDF5',
  },
  syncCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  syncTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  syncIcon: {
    fontSize: 22,
    marginRight: THEME.spacing.sm,
  },
  syncTitle: {
    fontSize: THEME.typography.base,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  syncSub: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.xs,
  },
  syncBadgeSynced: {
    backgroundColor: THEME.colors.status.synced.bg,
  },
  syncBadgePending: {
    backgroundColor: THEME.colors.status.pending.bg,
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  syncBadgeTextSynced: {
    color: THEME.colors.status.synced.text,
  },
  syncBadgeTextPending: {
    color: THEME.colors.status.pending.text,
  },
  syncCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
    paddingTop: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  syncFooterHint: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  syncDetailsLink: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: THEME.spacing.sm,
  },
  infoText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
});

export default RangerDashboardScreen;

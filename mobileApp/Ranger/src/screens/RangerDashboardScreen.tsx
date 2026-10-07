import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { OfflineBanner } from '../components/OfflineBanner';
import { getGreetingByTime } from '../utils/helpers';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useIncidentSync } from '../hooks/useIncidentSync';
import { IncidentStorageService } from '../services/incidentStorage';
import { authService } from '../services/authService';
import { conflictApi, ConflictReport } from '../services/conflictApi';

interface RangerDashboardScreenProps {
  navigation: any;
}

const ANIMAL_EMOJI_MAP: Record<string, string> = {
  'Asian Elephant': '🐘',
  'Sri Lankan Leopard': '🐆',
  'Wild Boar': '🐗',
  'Sloth Bear': '🐻',
  'Mugger Crocodile': '🐊',
  Other: '⚠️',
};

const SEVERITY_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  High: { bg: '#FEF2F2', text: '#EA580C', border: '#FDBA74' },
  Medium: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  Low: { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
};

export const RangerDashboardScreen: React.FC<RangerDashboardScreenProps> = ({ navigation }) => {
  const { isConnected } = useNetworkStatus();
  const { pendingCount, isSyncing, triggerSync, refreshCounts } = useIncidentSync();
  const [totalIncidentsCount, setTotalIncidentsCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [assignedReports, setAssignedReports] = useState<ConflictReport[]>([]);
  const [assignedLoading, setAssignedLoading] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const all = await IncidentStorageService.getAllLocalIncidents();
      setTotalIncidentsCount(all.length);
      await refreshCounts();
      
      let fetchedUser: any = null;
      try {
        const meRes = await authService.getMe();
        if (meRes && meRes.user) {
          fetchedUser = meRes.user;
          setUserProfile(meRes.user);
        }
      } catch {
        // Handled
      }

      // Fetch conflict reports assigned to this ranger
      try {
        setAssignedLoading(true);
        const uid = authService.userId || fetchedUser?.id || fetchedUser?._id;
        const uName = authService.userName || fetchedUser?.name;
        const missions = await conflictApi.getRangerAssignedReports(uid, uName);
        setAssignedReports(missions);
      } catch (err) {
        console.warn('Could not load assigned conflict reports:', err);
      } finally {
        setAssignedLoading(false);
      }
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

  const handleLogout = async () => {
    await authService.logout();
    navigation.replace('Login');
  };

  const initials = userProfile?.name
    ? userProfile.name
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : authService.userName
    ? authService.userName.substring(0, 2).toUpperCase()
    : 'RN';

  const rangerId = userProfile?.officerId || userProfile?.id || userProfile?._id || 'RN-402';

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
        <TouchableOpacity
          style={styles.rangerStrip}
          onPress={() => navigation.navigate('OfficerProfile')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="View Officer Profile"
          activeOpacity={0.8}
        >
          <View style={styles.rangerAvatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.rangerInfo}>
            <Text style={styles.rangerName}>
              {userProfile?.name || authService.userName || 'Ranger Officer'}
            </Text>
            <Text style={styles.rangerMeta}>
              {userProfile?.assignedPark || 'Yala National Park'} • {userProfile?.role || 'Ranger'}
            </Text>
          </View>
          <View style={styles.badgeNumber}>
            <Text style={styles.badgeNumberText}>
              {rangerId.length > 10 ? rangerId.substring(0, 10) : rangerId}
            </Text>
          </View>
        </TouchableOpacity>

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

        {/* SECTION: ASSIGNED CONFLICT MISSIONS (Dispatched by CLO) */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderTitleBox}>
            <Text style={styles.sectionHeader}>Assigned Conflict Missions</Text>
            {assignedReports.filter((r) => ['Dispatched', 'In Progress'].includes(r.status)).length > 0 && (
              <View style={styles.activeMissionBadge}>
                <Text style={styles.activeMissionBadgeText}>
                  {assignedReports.filter((r) => ['Dispatched', 'In Progress'].includes(r.status)).length} ACTIVE
                </Text>
              </View>
            )}
          </View>
          {assignedReports.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('IncidentsTab', { initialTab: 'ASSIGNED' })}>
              <Text style={styles.viewAllMissionsLink}>View All ({assignedReports.length}) →</Text>
            </TouchableOpacity>
          )}
        </View>

        {assignedReports.length === 0 ? (
          <View style={styles.noMissionsCard}>
            <Text style={styles.noMissionsIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.noMissionsTitle}>No Active Conflict Missions</Text>
              <Text style={styles.noMissionsSub}>
                When Community Liaison Officers dispatch you to wildlife conflicts, the mission orders will appear here immediately.
              </Text>
            </View>
          </View>
        ) : (
          assignedReports.slice(0, 3).map((item) => {
            const sev = SEVERITY_COLOR_MAP[item.severity] || SEVERITY_COLOR_MAP.Medium;
            const emoji = ANIMAL_EMOJI_MAP[item.animalSpecies] || '⚠️';
            const isDispatched = item.status === 'Dispatched';
            const isInProgress = item.status === 'In Progress';
            const isResolved = item.status === 'Resolved';

            return (
              <TouchableOpacity
                key={item._id || item.reportId}
                style={[
                  styles.missionCard,
                  isDispatched && styles.missionCardDispatched,
                  isInProgress && styles.missionCardInProgress,
                ]}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('ActiveIncidentTracking', { reportId: item.reportId })}
              >
                {/* Top Row: Animal, Severity, ID */}
                <View style={styles.missionCardTopRow}>
                  <View style={styles.missionAnimalBox}>
                    <Text style={styles.missionAnimalEmoji}>{emoji}</Text>
                    <View>
                      <Text style={styles.missionAnimalTitle}>
                        {item.animalSpecies}
                      </Text>
                      <Text style={styles.missionReportId}>#{item.reportId}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: sev.bg, borderColor: sev.border },
                    ]}
                  >
                    <Text style={[styles.severityBadgeText, { color: sev.text }]}>
                      {item.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Location & Conflict Type */}
                <View style={styles.missionDetailRow}>
                  <Text style={styles.missionDetailIcon}>📍</Text>
                  <Text style={styles.missionLocationText}>
                    {item.locationName} • {item.park}
                  </Text>
                </View>

                {/* Officer Notes / Instructions if provided */}
                {item.officerNotes ? (
                  <View style={styles.missionNotesBox}>
                    <Text style={styles.missionNotesIcon}>📻</Text>
                    <Text style={styles.missionNotesText} numberOfLines={2}>
                      "{item.officerNotes}"
                    </Text>
                  </View>
                ) : null}

                {/* Footer with Status and Respond Action */}
                <View style={styles.missionCardFooter}>
                  <View
                    style={[
                      styles.statusPill,
                      isDispatched && styles.statusPillDispatched,
                      isInProgress && styles.statusPillInProgress,
                      isResolved && styles.statusPillResolved,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        isDispatched && { backgroundColor: '#F59E0B' },
                        isInProgress && { backgroundColor: '#10B981' },
                        isResolved && { backgroundColor: '#6B7280' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        isDispatched && { color: '#B45309' },
                        isInProgress && { color: '#047857' },
                        isResolved && { color: '#4B5563' },
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.respondActionGroup}>
                    <Text style={styles.respondActionText}>
                      {isDispatched ? 'Respond to Scene →' : 'Track / Update →'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

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
  // ── Assigned Conflict Missions Styles ──────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  sectionHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeMissionBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radius.full,
  },
  activeMissionBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  viewAllMissionsLink: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  noMissionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.base,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.base,
    gap: 12,
  },
  noMissionsIcon: {
    fontSize: 28,
  },
  noMissionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  noMissionsSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  missionCardDispatched: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF5',
  },
  missionCardInProgress: {
    borderColor: '#10B981',
    backgroundColor: '#F7FEFA',
  },
  missionCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  missionAnimalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  missionAnimalEmoji: {
    fontSize: 28,
  },
  missionAnimalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  missionReportId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  missionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  missionDetailIcon: {
    fontSize: 14,
  },
  missionLocationText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  missionNotesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  missionNotesIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  missionNotesText: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 16,
  },
  missionCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  statusPillDispatched: {
    backgroundColor: '#FEF3C7',
  },
  statusPillInProgress: {
    backgroundColor: '#D1FAE5',
  },
  statusPillResolved: {
    backgroundColor: '#E5E7EB',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  respondActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  respondActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B4332',
  },
});

export default RangerDashboardScreen;

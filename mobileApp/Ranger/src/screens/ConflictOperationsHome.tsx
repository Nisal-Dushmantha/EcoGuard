import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { conflictApi } from '../services/conflictApi';
import { authService } from '../services/authService';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

interface ConflictOperationsHomeProps {
  navigation: any;
}

// ─── Design System Constants (Matches Reports & Activity) ─────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
};

const SEVERITY_BG: Record<string, string> = {
  Critical: '#FEE2E2',
  High: '#FEF2F2',
  Medium: '#FEF3C7',
  Low: '#D1FAE5',
};

const ANIMAL_ICON: Record<string, string> = {
  'Asian Elephant': '🐘',
  'Sri Lankan Leopard': '🐆',
  'Wild Boar': '🐗',
  'Sloth Bear': '🐻',
  'Mugger Crocodile': '🐊',
  Other: '⚠️',
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; borderColor: string; dotColor: string }
> = {
  'Pending Verification': { label: 'PENDING', color: '#B45309', bg: '#FEF3C7', borderColor: '#FDE68A', dotColor: '#F59E0B' },
  Verified: { label: 'VERIFIED', color: '#1D4ED8', bg: '#EFF6FF', borderColor: '#BFDBFE', dotColor: '#3B82F6' },
  Dispatched: { label: 'DISPATCHED', color: '#6D28D9', bg: '#F3E8FF', borderColor: '#E9D5FF', dotColor: '#8B5CF6' },
  'In Progress': { label: 'IN PROGRESS', color: '#0369A1', bg: '#E0F2FE', borderColor: '#BAE6FD', dotColor: '#0EA5E9' },
  Resolved: { label: 'RESOLVED', color: '#047857', bg: '#D1FAE5', borderColor: '#A7F3D0', dotColor: '#10B981' },
  Rejected: { label: 'REJECTED', color: '#B91C1C', bg: '#FEE2E2', borderColor: '#FECACA', dotColor: '#EF4444' },
  'False Alarm': { label: 'REJECTED', color: '#B91C1C', bg: '#FEE2E2', borderColor: '#FECACA', dotColor: '#EF4444' },
};

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff) || diff < 0) return 'Recently';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getGreetingTime(): string {
  const hours = new Date().getHours();
  if (hours < 12) return 'Good morning';
  if (hours < 18) return 'Good afternoon';
  return 'Good evening';
}

// ─── Main Operations Screen Component ─────────────────────────────────────────

export const ConflictOperationsHome: React.FC<ConflictOperationsHomeProps> = ({ navigation }) => {
  const { isConnected } = useNetworkStatus();

  const [summary, setSummary] = useState<any>({
    officer: null,
    stats: {
      pending: 0,
      verified: 0,
      dispatched: 0,
    },
    reports: [] as any[],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real backend summary data
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await conflictApi.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError('Unable to load conflict operations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Critical/High count calculation
  const criticalCount = useMemo(() => {
    if (!summary?.reports) return 0;
    return summary.reports.filter((r: any) => r.severity === 'Critical' || r.severity === 'High').length;
  }, [summary?.reports]);

  const officerName = summary?.officer?.name || authService.userName || 'Officer';
  const officerPark = summary?.officer?.assignedPark || 'WildGuard Operations';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. Compact Brand Top Header ───────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandName}>WildGuard Ops</Text>
            <Text style={styles.brandSub}>Conflict Operations</Text>
          </View>
        </View>
        <View style={styles.topRightControls}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Text style={styles.notificationIcon}>🔔</Text>
            {summary?.stats?.pending > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{summary.stats.pending}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigation.navigate('OfficerProfile')}
          >
            <Text style={styles.avatarText}>
              {officerName ? officerName.substring(0, 2).toUpperCase() : 'CO'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Offline / Network Status Banner ────────────────────────────── */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>Telemetry Disconnected • Offline Mode</Text>
        </View>
      )}

      {/* ── Main Scroll Content ───────────────────────────────────────────── */}
      {loading && !refreshing ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.stateTitle}>Loading conflict operations…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>Unable to load conflict operations.</Text>
          <Text style={styles.stateSubtitle}>Check your network connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1B4332']}
              tintColor="#1B4332"
            />
          }
        >
          {/* ── 3. Officer Summary Card ────────────────────────────────────── */}
          <View style={styles.officerCard}>
            <View style={styles.officerHeader}>
              <Text style={styles.officerTag}>DISPATCH CONSOLE • LIVE FEED</Text>
              <View style={styles.dutyBadge}>
                <View style={styles.dutyDot} />
                <Text style={styles.dutyText}>ON DUTY</Text>
              </View>
            </View>

            <Text style={styles.officerGreeting}>
              {getGreetingTime()}, {officerName}
            </Text>

            <View style={styles.officerLocation}>
              <Text style={styles.officerLocationIcon}>📍</Text>
              <Text style={styles.officerLocationText}>
                {officerPark} • Sector Active
              </Text>
            </View>
          </View>

          {/* ── 4. Operational Manifest (Stats Grid) ────────────────────── */}
          <View style={styles.manifestHeader}>
            <Text style={styles.sectionTitle}>Operational Manifest</Text>
            <Text style={styles.syncStatusText}>Live System Feed</Text>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, { borderColor: '#F59E0B' }]}
              onPress={() => navigation.navigate('PendingReports')}
              activeOpacity={0.8}
            >
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>🕒</Text>
                <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={styles.statNumber}>{summary?.stats?.pending || 0}</Text>
              <Text style={[styles.statLabel, { color: '#B45309' }]}>PENDING</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { borderColor: '#3B82F6' }]}
              onPress={() => navigation.navigate('PendingReports')}
              activeOpacity={0.8}
            >
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>🛡️</Text>
                <View style={[styles.statDot, { backgroundColor: '#3B82F6' }]} />
              </View>
              <Text style={styles.statNumber}>{summary?.stats?.verified || 0}</Text>
              <Text style={[styles.statLabel, { color: '#1E40AF' }]}>VERIFIED</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { borderColor: '#8B5CF6' }]}
              onPress={() => navigation.navigate('ConflictActivity')}
              activeOpacity={0.8}
            >
              <View style={styles.statHeader}>
                <Text style={styles.statIcon}>🚚</Text>
                <View style={[styles.statDot, { backgroundColor: '#8B5CF6' }]} />
              </View>
              <Text style={styles.statNumber}>{summary?.stats?.dispatched || 0}</Text>
              <Text style={[styles.statLabel, { color: '#6D28D9' }]}>DISPATCHED</Text>
            </TouchableOpacity>
          </View>

          {/* ── 5. Needs Attention Section ────────────────────────────────── */}
          <View style={styles.needsAttentionHeader}>
            <View style={styles.needsAttentionTitleGroup}>
              <View style={styles.redDot} />
              <Text style={styles.sectionTitle}>Needs Attention</Text>
            </View>
            {criticalCount > 0 && (
              <View style={styles.criticalBadge}>
                <Text style={styles.criticalBadgeText}>{criticalCount} HIGH PRIORITY</Text>
              </View>
            )}
          </View>

          {!summary?.reports || summary.reports.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>No reports needing immediate attention.</Text>
              <Text style={styles.emptySubtitle}>You're all caught up with high-priority field dispatches.</Text>
            </View>
          ) : (
            summary.reports.map((report: any, index: number) => {
              const sevColor = SEVERITY_COLORS[report.severity] ?? '#6B7280';
              const sevBg = SEVERITY_BG[report.severity] ?? '#F3F4F6';
              const statusCfg =
                STATUS_CONFIG[report.status] ?? STATUS_CONFIG['Pending Verification'];

              return (
                <View
                  key={report.reportId || index}
                  style={[styles.reportCard, { borderLeftColor: sevColor }]}
                >
                  {/* Card Top Row */}
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportId}>#{report.reportId}</Text>
                    <View style={styles.reportBadgeGroup}>
                      <View style={[styles.severityBadge, { backgroundColor: sevBg }]}>
                        <Text style={[styles.severityText, { color: sevColor }]}>
                          {report.severity.toUpperCase()}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusCfg.bg, borderColor: statusCfg.borderColor },
                        ]}
                      >
                        <View style={[styles.statusDot, { backgroundColor: statusCfg.dotColor }]} />
                        <Text style={[styles.statusText, { color: statusCfg.color }]}>
                          {statusCfg.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Conflict Type & Animal Emoji */}
                  <View style={styles.reportTitleRow}>
                    <Text style={styles.reportIcon}>
                      {ANIMAL_ICON[report.animalSpecies] ?? '⚠️'}
                    </Text>
                    <Text style={styles.reportTitle} numberOfLines={1}>
                      {report.conflictType}
                    </Text>
                  </View>

                  {/* Location Details */}
                  <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText} numberOfLines={1}>
                      {report.locationName}
                      {report.park ? ` (${report.park})` : ''}
                    </Text>
                  </View>

                  {/* Footer & Action */}
                  <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                      <Text style={styles.timeIcon}>🕒</Text>
                      <Text style={styles.timeText}>{formatTimeAgo(report.reportedAt)}</Text>
                      <Text style={styles.footerSep}>•</Text>
                      <Text style={styles.speciesText}>{report.animalSpecies}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() =>
                        navigation.navigate('ConflictReportDetails', { reportId: report.reportId })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.reviewBtnText}>REVIEW REPORT →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* ── 6. View All Pending Reports Action Button ─────────────────── */}
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate('PendingReports')}
            activeOpacity={0.85}
          >
            <Text style={styles.viewAllIcon}>📄</Text>
            <Text style={styles.viewAllText}>View All Pending Reports</Text>
            <View style={styles.viewAllBadge}>
              <Text style={styles.viewAllBadgeText}>{summary?.stats?.pending || 0}</Text>
            </View>
            <Text style={styles.viewAllArrow}>→</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* ── 7. Bottom Navigation Bar (Matches Reports & Activity) ───────── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Text style={styles.navIconActive}>🛡</Text>
          <Text style={styles.navLabelActive}>Operations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('PendingReports')}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navLabel}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ConflictActivity')}
        >
          <Text style={styles.navIcon}>🕒</Text>
          <Text style={styles.navLabel}>Activity</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles (Identical Design System to Reports & Activity) ───────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // 1. Top Bar Header
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B4332',
  },
  brandSub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    position: 'relative',
    marginRight: 16,
  },
  notificationIcon: {
    fontSize: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // 2. Offline Banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },

  // Scroll Content Area
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // 3. Officer Summary Card
  officerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  officerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  officerTag: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dutyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  dutyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  officerGreeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  officerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  officerLocationIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  officerLocationText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // 4. Manifest Header & Stats Grid
  manifestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  syncStatusText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 3,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // 5. Needs Attention Section
  needsAttentionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  needsAttentionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  criticalBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  criticalBadgeText: {
    color: '#B91C1C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Report Cards in Needs Attention
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  reportBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  reportTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  footerSep: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  speciesText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  reviewBtn: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // 6. View All Pending Button
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B4332',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  viewAllBadge: {
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  viewAllBadgeText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '800',
  },
  viewAllArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // States
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  stateSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // 7. Bottom Navigation (Exact Match to Reports & Activity)
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#A7F3D0',
    borderRadius: 20,
    marginHorizontal: 16,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    color: '#9CA3AF',
  },
  navIconActive: {
    fontSize: 20,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  navLabelActive: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '800',
  },
});

export default ConflictOperationsHome;

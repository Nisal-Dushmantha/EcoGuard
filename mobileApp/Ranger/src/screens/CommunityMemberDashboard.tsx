import React, { useState, useEffect, useCallback } from 'react';
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
import { conflictApi, ConflictReport } from '../services/conflictApi';
import { authService } from '../services/authService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface CommunityMemberDashboardProps {
  navigation: any;
}

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
  'Pending Verification': { label: 'PENDING REVIEW', color: '#B45309', bg: '#FEF3C7', borderColor: '#FDE68A', dotColor: '#F59E0B' },
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

export const CommunityMemberDashboard: React.FC<CommunityMemberDashboardProps> = ({ navigation }) => {
  const { isConnected } = useNetworkStatus();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [memberName, setMemberName] = useState<string>(authService.userName || 'Community Member');

  const [stats, setStats] = useState({
    myReports: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [recentReports, setRecentReports] = useState<ConflictReport[]>([]);

  // Fetch real data for logged-in Community Member
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await conflictApi.getMemberDashboard();
      if (data) {
        setStats(data.stats || { myReports: 0, pending: 0, inProgress: 0, resolved: 0 });
        setRecentReports(data.reports || []);
      }
      if (authService.userName) {
        setMemberName(authService.userName);
      }
    } catch (err: any) {
      setError('Unable to load member dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', () => loadData());
    return unsub;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. Compact Top Bar Header ───────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandName}>WildGuard Ops</Text>
            <Text style={styles.brandSub}>Community Member Portal</Text>
          </View>
        </View>
        <View style={styles.topRightControls}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Text style={styles.notificationIcon}>🔔</Text>
            {stats.pending > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{stats.pending}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigation.navigate('OfficerProfile')}
          >
            <Text style={styles.avatarText}>
              {memberName ? memberName.substring(0, 2).toUpperCase() : 'CM'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Network Status Banner ───────────────────────────────────────── */}
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
          <Text style={styles.stateTitle}>Loading Community Portal…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>Unable to load dashboard.</Text>
          <Text style={styles.stateSubtitle}>Check your connection and try again.</Text>
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
          {/* ── 3. Community Member Welcome Card ──────────────────────────── */}
          <View style={styles.memberCard}>
            <View style={styles.memberCardTop}>
              <View style={styles.roleBadge}>
                <View style={styles.roleDot} />
                <Text style={styles.roleBadgeText}>COMMUNITY MEMBER</Text>
              </View>
              <Text style={styles.districtText}>📍 Yala Boundary Sector</Text>
            </View>

            <Text style={styles.memberGreeting}>Welcome, {memberName}</Text>
            <Text style={styles.memberSubtext}>
              Report wildlife encounters, track liaison verification, and protect your community.
            </Text>
          </View>

          {/* ── 4. Primary CTA: Report Wildlife Conflict ──────────────────── */}
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            onPress={() => navigation.navigate('ReportWildlifeConflict')}
            activeOpacity={0.88}
          >
            <View style={styles.ctaIconBox}>
              <Text style={styles.ctaIcon}>⚠️</Text>
            </View>
            <View style={styles.ctaTextGroup}>
              <Text style={styles.ctaTitle}>Report Wildlife Conflict</Text>
              <Text style={styles.ctaSub}>Log elephant sightings, crop raiding, or property threat</Text>
            </View>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>

          {/* ── 5. Dashboard Summary Grid ─────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Incident Summary</Text>
            <Text style={styles.sectionSub}>Real-Time Tracking</Text>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, { borderColor: '#1B4332' }]}
              onPress={() => navigation.navigate('CommunityMemberReports')}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>📋</Text>
              <Text style={styles.statNumber}>{stats.myReports}</Text>
              <Text style={[styles.statLabel, { color: '#1B4332' }]}>MY REPORTS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { borderColor: '#F59E0B' }]}
              onPress={() => navigation.navigate('CommunityMemberReports', { status: 'Pending Verification' })}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>🕒</Text>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={[styles.statLabel, { color: '#B45309' }]}>PENDING</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { borderColor: '#0EA5E9' }]}
              onPress={() => navigation.navigate('CommunityMemberReports', { status: 'In Progress' })}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statNumber}>{stats.inProgress}</Text>
              <Text style={[styles.statLabel, { color: '#0369A1' }]}>IN PROGRESS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { borderColor: '#10B981' }]}
              onPress={() => navigation.navigate('CommunityMemberReports', { status: 'Resolved' })}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statNumber}>{stats.resolved}</Text>
              <Text style={[styles.statLabel, { color: '#047857' }]}>RESOLVED</Text>
            </TouchableOpacity>
          </View>

          {/* ── 6. Recent Reports Section ─────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Incident Reports</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CommunityMemberReports')}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentReports.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>No wildlife conflicts reported yet.</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Report Wildlife Conflict" above to log a new incident in your area.
              </Text>
            </View>
          ) : (
            recentReports.map((report) => {
              const sevColor = SEVERITY_COLORS[report.severity] ?? '#6B7280';
              const sevBg = SEVERITY_BG[report.severity] ?? '#F3F4F6';
              const statusCfg =
                STATUS_CONFIG[report.status] ?? STATUS_CONFIG['Pending Verification'];

              return (
                <View
                  key={report._id || report.reportId}
                  style={[styles.reportCard, { borderLeftColor: sevColor }]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.reportId}>#{report.reportId}</Text>
                    <View style={styles.cardBadgeGroup}>
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

                  <View style={styles.titleRow}>
                    <Text style={styles.animalIcon}>
                      {ANIMAL_ICON[report.animalSpecies] ?? '⚠️'}
                    </Text>
                    <Text style={styles.conflictTitle} numberOfLines={1}>
                      {report.conflictType}
                    </Text>
                  </View>

                  <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText} numberOfLines={1}>
                      {report.locationName}
                      {report.park ? ` (${report.park})` : ''}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.timeText}>🕒 {formatTimeAgo(report.reportedAt)}</Text>
                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() =>
                        navigation.navigate('ConflictReportDetails', { reportId: report.reportId })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.reviewBtnText}>VIEW STATUS →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* ── 7. Bottom Navigation Bar ───────────────────────────────────────── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navLabelActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('CommunityMemberReports')}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navLabel}>My Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerFab}
          onPress={() => navigation.navigate('ReportWildlifeConflict')}
          activeOpacity={0.88}
        >
          <Text style={styles.centerFabIcon}>＋</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('OfficerProfile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // Header
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

  // Offline banner
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

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // Welcome Member Card
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  memberCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  districtText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  memberGreeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  memberSubtext: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },

  // Primary CTA Button
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B4332',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ctaIcon: {
    fontSize: 22,
  },
  ctaTextGroup: {
    flex: 1,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  ctaSub: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '500',
  },
  ctaArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 8,
  },

  // Section Header
  sectionHeader: {
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
  sectionSub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewAllLink: {
    fontSize: 12,
    color: '#1B4332',
    fontWeight: '800',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 2,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Report Cards
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
  cardHeader: {
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
  cardBadgeGroup: {
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  animalIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  conflictTitle: {
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
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  reviewBtn: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
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

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
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
    marginHorizontal: 8,
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
  centerFab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    elevation: 4,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  centerFabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default CommunityMemberDashboard;

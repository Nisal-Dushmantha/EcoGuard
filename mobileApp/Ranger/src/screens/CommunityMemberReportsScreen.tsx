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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conflictApi, ConflictReport } from '../services/conflictApi';

interface CommunityMemberReportsProps {
  navigation: any;
  route?: { params?: { status?: string } };
}

const FILTER_TABS = [
  { key: 'All', label: 'All' },
  { key: 'Pending Verification', label: 'Pending' },
  { key: 'Verified', label: 'Verified' },
  { key: 'Dispatched', label: 'Dispatched' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Resolved', label: 'Resolved' },
  { key: 'Rejected', label: 'Rejected' },
];

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

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const CommunityMemberReportsScreen: React.FC<CommunityMemberReportsProps> = ({
  navigation,
  route,
}) => {
  const initialFilter = route?.params?.status || 'All';
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);

  const [reports, setReports] = useState<ConflictReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setError(null);
      const params: any = {};
      if (selectedFilter !== 'All') {
        params.status = selectedFilter;
      }
      const data = await conflictApi.getConflictReports(params);
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    loadReports();
    const unsub = navigation.addListener('focus', () => loadReports());
    return unsub;
  }, [navigation, loadReports]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.topBarTitle}>My Incident Reports</Text>
          <Text style={styles.topBarSub}>Track liaison verification & dispatch status</Text>
        </View>
        <TouchableOpacity
          style={styles.addReportBtn}
          onPress={() => navigation.navigate('ReportWildlifeConflict')}
        >
          <Text style={styles.addReportText}>＋ New</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter Chips Horizontal Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_TABS.map((tab) => {
            const active = selectedFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedFilter(tab.key)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.stateTitle}>Loading your reports…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>Unable to load reports.</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadReports}>
            <Text style={styles.retryBtnText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B4332']} />}
        >
          <Text style={styles.emptyEmoji}>🌿</Text>
          <Text style={styles.emptyTitle}>
            {selectedFilter === 'All'
              ? 'You have not submitted any wildlife conflict reports yet.'
              : `No ${selectedFilter} reports found.`}
          </Text>
          <Text style={styles.emptySubtitle}>
            When you report wildlife conflicts, your reports and their real-time field status will appear here.
          </Text>
          <TouchableOpacity
            style={styles.newReportCta}
            onPress={() => navigation.navigate('ReportWildlifeConflict')}
          >
            <Text style={styles.newReportCtaText}>Report Wildlife Conflict</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id || item.reportId}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B4332']} />}
          renderItem={({ item: report }) => {
            const sevColor = SEVERITY_COLORS[report.severity] ?? '#6B7280';
            const sevBg = SEVERITY_BG[report.severity] ?? '#F3F4F6';
            const statusCfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG['Pending Verification'];

            return (
              <View style={[styles.reportCard, { borderLeftColor: sevColor }]}>
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
                  <Text style={styles.animalIcon}>{ANIMAL_ICON[report.animalSpecies] ?? '⚠️'}</Text>
                  <Text style={styles.conflictTitle} numberOfLines={1}>
                    {report.animalSpecies} • {report.conflictType}
                  </Text>
                </View>

                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {report.locationName}
                    {report.park ? ` (${report.park})` : ''}
                  </Text>
                </View>

                <Text style={styles.descText} numberOfLines={2}>
                  {report.description}
                </Text>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.timeText}>🕒 {formatTimeAgo(report.reportedAt)}</Text>
                    <Text style={styles.dateText}>{formatDate(report.reportedAt)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() =>
                      navigation.navigate('ConflictReportDetails', { reportId: report.reportId })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewDetailsText}>VIEW STATUS →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.replace('CommunityMemberDashboard')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemActive}>
          <Text style={styles.navIconActive}>📋</Text>
          <Text style={styles.navLabelActive}>My Reports</Text>
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
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: '#374151', fontWeight: '700' },
  topBarTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  topBarSub: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  addReportBtn: { backgroundColor: '#1B4332', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addReportText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // Filters
  filterContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 8 },
  filterScroll: { paddingHorizontal: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '800' },

  // List
  listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 80 },

  // Card
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
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reportId: { fontSize: 12, fontWeight: '800', color: '#374151' },
  cardBadgeGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  severityBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  severityText: { fontSize: 10, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 9, fontWeight: '800' },

  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  animalIcon: { fontSize: 18, marginRight: 8 },
  conflictTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#111827' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  locationIcon: { fontSize: 13, marginRight: 5 },
  locationText: { flex: 1, fontSize: 13, color: '#4B5563', fontWeight: '500' },
  descText: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 10 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  timeText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  dateText: { fontSize: 10, color: '#9CA3AF' },
  viewDetailsBtn: { backgroundColor: '#1B4332', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewDetailsText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  // States
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorEmoji: { fontSize: 36, marginBottom: 12 },
  stateTitle: { fontSize: 16, fontWeight: '700', color: '#374151', textAlign: 'center', marginTop: 12, marginBottom: 6 },
  stateSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#1B4332', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  newReportCta: { backgroundColor: '#1B4332', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  newReportCtaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  navItemActive: { alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  navIcon: { fontSize: 20, opacity: 0.6 },
  navIconActive: { fontSize: 20, opacity: 1 },
  navLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  navLabelActive: { fontSize: 11, color: '#1B4332', fontWeight: '800', marginTop: 2 },
  centerFab: {
    top: -14,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  centerFabIcon: { fontSize: 24, color: '#FFFFFF', fontWeight: 'bold', marginTop: -2 },
});

export default CommunityMemberReportsScreen;

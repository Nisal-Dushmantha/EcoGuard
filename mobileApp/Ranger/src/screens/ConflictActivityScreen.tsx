import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conflictApi, ConflictReport } from '../services/conflictApi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConflictActivityScreenProps {
  navigation: any;
}

type FilterStatus = 'All' | 'In Progress' | 'Dispatched' | 'Verified' | 'Resolved' | 'Rejected';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const STATUS_COLORS: Record<string, string> = {
  'Pending Verification': '#6B7280',
  'Verified': '#8B5CF6',
  'Dispatched': '#A855F7',
  'In Progress': '#3B82F6',
  'Resolved': '#10B981',
  'Rejected': '#6B7280',
  'False Alarm': '#6B7280',
};

const STATUS_BG: Record<string, string> = {
  'Pending Verification': '#F3F4F6',
  'Verified': '#EDE9FE',
  'Dispatched': '#F3E8FF',
  'In Progress': '#EFF6FF',
  'Resolved': '#D1FAE5',
  'Rejected': '#F3F4F6',
  'False Alarm': '#F3F4F6',
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  const today = new Date();
  const isToday = d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
    
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return `${hours}:${mins} ${ampm} today`;
  if (isYesterday) return `Yesterday, ${hours}:${mins} ${ampm}`;
  return `${d.toLocaleDateString()}, ${hours}:${mins} ${ampm}`;
}

// ─── Report Card ──────────────────────────────────────────────────────────────

const ActivityCard = ({ report, onPress }: { report: ConflictReport; onPress: () => void }) => {
  const sevColor = SEVERITY_COLORS[report.severity] ?? '#6B7280';
  const sevBg = SEVERITY_BG[report.severity] ?? '#F3F4F6';

  let displayStatus = report.status.toUpperCase();
  if (report.status === 'False Alarm') displayStatus = 'REJECTED';
  if (report.status === 'Pending Verification') displayStatus = 'PENDING';

  const statusColor = STATUS_COLORS[report.status === 'False Alarm' ? 'Rejected' : report.status] ?? '#6B7280';
  const statusBg = STATUS_BG[report.status === 'False Alarm' ? 'Rejected' : report.status] ?? '#F3F4F6';

  const rangerId = report.assignedRangerId || 'Unassigned';
  const rangerInitials = report.assignedRangerId ? report.assignedRangerId.slice(0, 2).toUpperCase() : 'RN';

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardReportId}>{report.reportId}</Text>
          <Text style={styles.cardTimeSep}>·</Text>
          <Text style={styles.cardTimeText}>{formatTime(report.reportedAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          {report.status === 'Dispatched' && <Text style={[styles.statusIcon, { color: statusColor }]}>📍</Text>}
          {report.status === 'In Progress' && <Text style={[styles.statusIcon, { color: statusColor }]}>🌍</Text>}
          {report.status === 'Resolved' && <Text style={[styles.statusIcon, { color: statusColor }]}>✓</Text>}
          {(report.status === 'Rejected' || report.status === 'False Alarm') && <Text style={[styles.statusIcon, { color: statusColor }]}>✕</Text>}
          <Text style={[styles.statusText, { color: statusColor }]}>{displayStatus}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.conflictTitle} numberOfLines={1}>
        {report.conflictType}
      </Text>

      {/* Location Row */}
      <View style={styles.locationRow}>
        <View style={styles.locationLeft}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>{report.locationName}</Text>
        </View>
        <View style={styles.severityBox}>
          <Text style={styles.severityLabel}>SEVERITY:</Text>
          <View style={[styles.severityPill, { backgroundColor: sevBg }]}>
            <Text style={[styles.severityPillText, { color: sevColor }]}>{report.severity.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Resolved Note */}
      {report.status === 'Resolved' && (
        <View style={styles.resolvedBox}>
          <Text style={styles.resolvedTitle}>RESOLUTION FIELD REPORT</Text>
          <Text style={styles.resolvedText}>
            "{report.actionTaken || 'Incident resolved successfully.'}"
          </Text>
        </View>
      )}

      {/* Rejected Note */}
      {(report.status === 'Rejected' || report.status === 'False Alarm') && (
        <View style={styles.rejectedBox}>
          <Text style={styles.rejectedTitle}>TRIAGE VERIFICATION NOTICE</Text>
          <Text style={styles.rejectedText}>
            Reason: {report.rejectionReason || 'False Alarm'}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.rangerInfo}>
          <View style={styles.rangerAvatar}>
            <Text style={styles.rangerInitials}>{rangerInitials}</Text>
          </View>
          <View>
            <Text style={styles.rangerNameLabel}>Ranger {rangerId}</Text>
            {report.assignedRangerId ? (
              <Text style={styles.rangerSubLabel}>Assigned</Text>
            ) : (
              <Text style={styles.rangerSubLabel}>Pending Assignment</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
          <Text style={styles.actionBtnText}>
            {report.status === 'Resolved' || report.status === 'Rejected' || report.status === 'False Alarm' ? 'Archive Record >' : 'Dossier >'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ConflictActivityScreen: React.FC<ConflictActivityScreenProps> = ({ navigation }) => {
  const [reports, setReports] = useState<ConflictReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      // Fetch all reports and filter locally
      const result = await conflictApi.getConflictReports({
        sort: 'newest',
        limit: 200,
      });
      setReports(result.reports);
    } catch (err: any) {
      setError('Unable to load conflict activity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchReports());
    return unsub;
  }, [navigation, fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const filteredReports = useMemo(() => {
    let list = reports;
    
    // Status Filter
    if (activeFilter !== 'All') {
      if (activeFilter === 'Rejected') {
        list = list.filter(r => r.status === 'Rejected' || r.status === 'False Alarm');
      } else {
        list = list.filter(r => r.status === activeFilter);
      }
    }

    // Search Filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.reportId.toLowerCase().includes(q) ||
          r.locationName.toLowerCase().includes(q) ||
          r.animalSpecies.toLowerCase().includes(q) ||
          r.conflictType.toLowerCase().includes(q) ||
          (r.assignedRangerId && r.assignedRangerId.toLowerCase().includes(q))
      );
    }

    return list;
  }, [reports, search, activeFilter]);

  const filters: FilterStatus[] = ['All', 'In Progress', 'Dispatched', 'Verified', 'Resolved', 'Rejected'];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerShield}>🛡️</Text>
          <View>
            <Text style={styles.headerTitle}>WildGuard Ops <Text style={styles.headerDot}>●</Text></Text>
            <Text style={styles.headerSubtitle}>ACTIVITY & CASE HISTORY</Text>
          </View>
        </View>
        <View style={styles.headerIconsRow}>
          <Text style={styles.headerIcon}>🔍</Text>
          <Text style={styles.headerIcon}>🎛️</Text>
          <Text style={styles.headerIconBadge}>🔔</Text>
        </View>
      </View>

      {/* ── Banner ───────────────────────────────────────────────────── */}
      <View style={styles.bannerRow}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerIcon}>📋</Text>
          <Text style={styles.bannerText}>Historical & Active Incident Dossiers</Text>
        </View>
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeText}>{reports.length} Total</Text>
        </View>
      </View>

      {/* ── Search & Date Row ────────────────────────────────────────── */}
      <View style={styles.searchDateRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchBoxIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search dossier ID, species, loc..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={styles.dateFilter}>
          <Text style={styles.dateFilterIcon}>📅</Text>
          <Text style={styles.dateFilterText}>Today - 7D ▾</Text>
        </TouchableOpacity>
      </View>

      {/* ── Status Filters ─────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive, f === 'All' && activeFilter === 'All' && { backgroundColor: '#1B4332', borderColor: '#1B4332' }]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
              {f} {f === 'All' && <Text style={{fontSize:10}}>⌘</Text>}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.centerText}>Loading activity...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.centerEmoji}>⚠️</Text>
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchReports(); }}>
            <Text style={styles.retryBtnText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1B4332']}
              tintColor="#1B4332"
            />
          }
        >
          {filteredReports.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No conflict reports found.</Text>
            </View>
          ) : (
            filteredReports.map(report => {
              const targetRoute = ['Dispatched', 'In Progress', 'Resolved'].includes(report.status) 
                ? 'ActiveIncidentTracking' 
                : 'ConflictReportDetails';
              return (
                <ActivityCard
                  key={report._id || report.reportId}
                  report={report}
                  onPress={() => navigation.navigate(targetRoute, { reportId: report.reportId })}
                />
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* ── Bottom Navigation ─────────────────────────────────────────── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ConflictOperationsHome')}
        >
          <Text style={styles.navIcon}>🛡</Text>
          <Text style={styles.navLabel}>Operations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('PendingReports')}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navLabel}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemActive}>
          <View style={styles.activeIconCircle}>
            <Text style={styles.navIconActive}>🕒</Text>
          </View>
          <Text style={styles.navLabelActive}>Activity</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerShield: { fontSize: 24, marginRight: 8 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  headerDot: { color: '#059669', fontSize: 14 },
  headerSubtitle: { fontSize: 10, color: '#6B7280', fontWeight: '700', letterSpacing: 0.5 },
  headerIconsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { fontSize: 18, color: '#4B5563' },
  headerIconBadge: { fontSize: 18, color: '#4B5563' }, // mock badge

  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerIcon: { fontSize: 14, marginRight: 6 },
  bannerText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  bannerBadge: { backgroundColor: '#1B4332', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  bannerBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  searchDateRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchBoxIcon: { fontSize: 14, marginRight: 6, color: '#9CA3AF' },
  searchInput: { flex: 1, fontSize: 13, color: '#111827' },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  dateFilterIcon: { fontSize: 14, marginRight: 6 },
  dateFilterText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  filterScroll: { maxHeight: 44, marginTop: 12 },
  filterScrollContent: { paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterChipActive: { backgroundColor: '#EEF2FF', borderColor: '#818CF8' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  filterChipTextActive: { color: '#4338CA' },

  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  cardReportId: { fontSize: 11, fontWeight: '800', color: '#374151' },
  cardTimeSep: { fontSize: 11, color: '#9CA3AF', marginHorizontal: 4 },
  cardTimeText: { fontSize: 11, color: '#6B7280' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusIcon: { fontSize: 10, marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },

  conflictTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },

  locationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8, marginBottom: 12 },
  locationLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  locationIcon: { fontSize: 12, marginRight: 6 },
  locationText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  severityBox: { flexDirection: 'row', alignItems: 'center' },
  severityLabel: { fontSize: 9, fontWeight: '700', color: '#6B7280', marginRight: 4 },
  severityPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  severityPillText: { fontSize: 10, fontWeight: '800' },

  resolvedBox: { backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  resolvedTitle: { fontSize: 10, fontWeight: '800', color: '#1D4ED8', marginBottom: 4 },
  resolvedText: { fontSize: 12, color: '#1E3A8A', fontStyle: 'italic' },

  rejectedBox: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#EF4444' },
  rejectedTitle: { fontSize: 10, fontWeight: '800', color: '#B91C1C', marginBottom: 4 },
  rejectedText: { fontSize: 12, color: '#991B1B' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  rangerInfo: { flexDirection: 'row', alignItems: 'center' },
  rangerAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#A7F3D0', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  rangerInitials: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  rangerNameLabel: { fontSize: 11, fontWeight: '700', color: '#374151' },
  rangerSubLabel: { fontSize: 10, color: '#6B7280' },
  
  actionBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#4338CA' },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerEmoji: { fontSize: 32, marginBottom: 10 },
  centerText: { fontSize: 14, color: '#4B5563', fontWeight: '500', marginBottom: 16 },
  retryBtn: { backgroundColor: '#1B4332', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700' },

  emptyBox: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
    paddingTop: 10,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navItemActive: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navIcon: { fontSize: 20, marginBottom: 2, color: '#9CA3AF' },
  activeIconCircle: { backgroundColor: '#A7F3D0', width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  navIconActive: { fontSize: 18, color: '#065F46' },
  navLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  navLabelActive: { fontSize: 11, color: '#065F46', fontWeight: '800' },
});

export default ConflictActivityScreen;

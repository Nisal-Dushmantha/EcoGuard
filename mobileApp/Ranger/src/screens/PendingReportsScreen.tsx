import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { conflictApi, ConflictReport } from '../services/conflictApi';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

// ─── Types ───────────────────────────────────────────────────────────────────

type SortMode = 'newest' | 'oldest' | 'severity';

interface PendingReportsScreenProps {
  navigation: any;
}

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

const ANIMAL_ICON: Record<string, string> = {
  'Asian Elephant': '🐘',
  'Sri Lankan Leopard': '🐆',
  'Wild Boar': '🐗',
  'Sloth Bear': '🐻',
  'Mugger Crocodile': '🐊',
  Other: '⚠️',
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

const FilterChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
    activeOpacity={0.75}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Report Card ──────────────────────────────────────────────────────────────

const ReportCard = ({
  report,
  onReview,
  isPriority,
}: {
  report: ConflictReport;
  onReview: () => void;
  isPriority: boolean;
}) => {
  const sevColor = SEVERITY_COLORS[report.severity] ?? '#6B7280';
  const sevBg = SEVERITY_BG[report.severity] ?? '#F3F4F6';

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: sevColor },
        isPriority && styles.cardPriority,
      ]}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardReportId}>#{report.reportId}</Text>
        <View style={styles.cardBadgeRow}>
          <View style={[styles.severityBadge, { backgroundColor: sevBg }]}>
            <Text style={[styles.severityText, { color: sevColor }]}>
              {report.severity.toUpperCase()}
            </Text>
          </View>
          {isPriority && (
            <View style={styles.immediateActionBadge}>
              <Text style={styles.immediateActionText}>IMMEDIATE ACTION</Text>
            </View>
          )}
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Conflict Type Title */}
      <View style={styles.titleRow}>
        <Text style={styles.animalIcon}>
          {ANIMAL_ICON[report.animalSpecies] ?? '⚠️'}
        </Text>
        <Text style={styles.conflictTitle} numberOfLines={1}>
          {report.conflictType}
        </Text>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>
          {report.locationName}
          {report.park ? ` (${report.park})` : ''}
        </Text>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {report.description || 'No description provided.'}
      </Text>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.timeIcon}>🕒</Text>
          <Text style={styles.timeText}>{formatTimeAgo(report.reportedAt)}</Text>
          {report.reporterName ? (
            <>
              <Text style={styles.footerSep}>•</Text>
              <Text style={styles.reporterText} numberOfLines={1}>
                {report.reporterName}
              </Text>
            </>
          ) : null}
        </View>

        <TouchableOpacity style={styles.reviewBtn} onPress={onReview} activeOpacity={0.8}>
          <Text style={styles.reviewBtnText}>REVIEW →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const PendingReportsScreen: React.FC<PendingReportsScreenProps> = ({ navigation }) => {
  const { isConnected } = useNetworkStatus();

  // Data
  const [reports, setReports] = useState<ConflictReport[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // UI controls
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');   // '' | 'Low' | 'Medium' | 'High' | 'Critical'
  const [animalFilter, setAnimalFilter] = useState('');        // '' | species string
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  // ── Fetch from backend ──────────────────────────────────────────────────────

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      const result = await conflictApi.getConflictReports({
        status: 'Pending Verification',
        sort: sortMode,
        limit: 100,
      });
      setReports(result.reports);
      setTotalCount(result.total);
    } catch (err: any) {
      setError('Unable to load conflict reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortMode]);

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

  // ── Client-side filtering on loaded data ────────────────────────────────────

  const filteredReports = useMemo(() => {
    let list = reports;

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.reportId.toLowerCase().includes(q) ||
          r.locationName.toLowerCase().includes(q) ||
          r.animalSpecies.toLowerCase().includes(q) ||
          r.conflictType.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // Severity filter
    if (severityFilter) {
      list = list.filter((r) => r.severity === severityFilter);
    }

    // Animal filter
    if (animalFilter) {
      list = list.filter((r) => r.animalSpecies === animalFilter);
    }

    return list;
  }, [reports, search, severityFilter, animalFilter]);

  // ── Derived counts ──────────────────────────────────────────────────────────
  const criticalCount = useMemo(
    () => filteredReports.filter((r) => r.severity === 'Critical' || r.severity === 'High').length,
    [filteredReports]
  );

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleReview = (reportId: string) => {
    navigation.navigate('ConflictReportDetails', { reportId });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>Pending Reports</Text>
            <Text style={styles.screenSubtitle}>WildGuard Ops | UC03</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          {!loading && (
            <View style={styles.reportCountBadge}>
              <Text style={styles.reportCountText}>{totalCount} Reports</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Offline Banner ───────────────────────────────────────────── */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>Telemetry Disconnected • Offline Mode</Text>
        </View>
      )}
      {isConnected && (
        <View style={styles.onlineBanner}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Telemetry Connected: Sector 4 Live</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={onRefresh}>
            <Text style={styles.syncBtnText}>⟳ Sync</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Search ──────────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Village, ID, or Animal..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter Strip ────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterStrip}
        contentContainerStyle={styles.filterStripContent}
      >
        {/* Severity filters */}
        <FilterChip
          label="All Severities"
          active={!severityFilter}
          onPress={() => setSeverityFilter('')}
        />
        {['Critical', 'High', 'Medium', 'Low'].map((sev) => (
          <FilterChip
            key={sev}
            label={sev}
            active={severityFilter === sev}
            onPress={() => setSeverityFilter(sev === severityFilter ? '' : sev)}
          />
        ))}

        <View style={styles.filterDivider} />

        {/* Animal filters */}
        <FilterChip
          label="All Animals"
          active={!animalFilter}
          onPress={() => setAnimalFilter('')}
        />
        {['Asian Elephant', 'Sri Lankan Leopard', 'Wild Boar', 'Sloth Bear', 'Mugger Crocodile'].map((a) => (
          <FilterChip
            key={a}
            label={a === 'Asian Elephant' ? 'Elephant 🐘' : a === 'Sri Lankan Leopard' ? 'Leopard 🐆' : a === 'Wild Boar' ? 'Wild Boar 🐗' : a === 'Sloth Bear' ? 'Bear 🐻' : 'Crocodile 🐊'}
            active={animalFilter === a}
            onPress={() => setAnimalFilter(a === animalFilter ? '' : a)}
          />
        ))}
      </ScrollView>

      {/* ── Sort + Stats Row ─────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statsLeft}>
          {criticalCount > 0 && (
            <View style={styles.criticalPill}>
              <Text style={styles.criticalPillText}>{criticalCount} Critical/High</Text>
            </View>
          )}
          <Text style={styles.resultCount}>
            {loading ? '…' : `${filteredReports.length} showing`}
          </Text>
        </View>
        <View style={styles.sortGroup}>
          {(['newest', 'oldest', 'severity'] as SortMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.sortBtn, sortMode === mode && styles.sortBtnActive]}
              onPress={() => setSortMode(mode)}
            >
              <Text style={[styles.sortBtnText, sortMode === mode && styles.sortBtnTextActive]}>
                {mode === 'newest' ? 'Newest' : mode === 'oldest' ? 'Oldest' : 'Priority'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Content Area ─────────────────────────────────────────────── */}
      {loading && !refreshing ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.stateTitle}>Loading conflict reports…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>Unable to load conflict reports.</Text>
          <Text style={styles.stateSubtitle}>Check your network connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchReports(); }}>
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
          {/* Priority Queue label */}
          {filteredReports.length > 0 && (
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>PRIORITY CONFLICT QUEUE</Text>
              <View style={styles.queueDot} />
            </View>
          )}

          {filteredReports.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>No pending conflict reports.</Text>
              <Text style={styles.emptySubtitle}>
                All current community conflict reports have been processed.
              </Text>
            </View>
          ) : (
            filteredReports.map((report, index) => (
              <ReportCard
                key={report._id || report.reportId}
                report={report}
                isPriority={index === 0 && (report.severity === 'Critical' || report.severity === 'High')}
                onReview={() => handleReview(report.reportId)}
              />
            ))
          )}

          {/* Dispatched footer hint */}
          {filteredReports.length > 0 && (
            <TouchableOpacity
              style={styles.dispatchedRow}
              onPress={() => navigation.navigate('ConflictActivity')}
            >
              <Text style={styles.dispatchedIcon}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.dispatchedTitle}>
                  {totalCount - filteredReports.length > 0
                    ? `${totalCount - filteredReports.length} Additional Dispatched`
                    : 'View Dispatched Reports'}
                </Text>
                <Text style={styles.dispatchedSub}>
                  Field teams active across multiple sectors
                </Text>
              </View>
              <Text style={styles.dispatchedArrow}>›</Text>
            </TouchableOpacity>
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

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Text style={styles.navIconActive}>📋</Text>
          <Text style={styles.navLabelActive}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('AlertsTab')}
        >
          <Text style={styles.navIcon}>🕒</Text>
          <Text style={styles.navLabel}>Activity</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backBtnText: { fontSize: 20, color: '#374151', fontWeight: '700' },
  screenTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  screenSubtitle: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  topBarRight: { flexDirection: 'row', alignItems: 'center' },
  reportCountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  reportCountText: { color: '#065F46', fontSize: 12, fontWeight: '800' },

  // Banners
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
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 8,
  },
  offlineText: { fontSize: 12, color: '#991B1B', fontWeight: '600' },
  onlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
  },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8,
  },
  onlineText: { fontSize: 11, color: '#065F46', fontWeight: '600', flex: 1 },
  syncBtn: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  syncBtnText: { fontSize: 11, color: '#065F46', fontWeight: '700' },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { fontSize: 16, marginRight: 8, color: '#9CA3AF' },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  clearBtn: { padding: 4 },
  clearBtnText: { fontSize: 14, color: '#9CA3AF', fontWeight: '700' },

  // Filters
  filterStrip: { maxHeight: 44 },
  filterStripContent: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  filterDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },

  // Stats + sort row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
  },
  statsLeft: { flexDirection: 'row', alignItems: 'center' },
  criticalPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  criticalPillText: { fontSize: 10, color: '#B91C1C', fontWeight: '800' },
  resultCount: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  sortGroup: { flexDirection: 'row' },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  sortBtnActive: { backgroundColor: '#E8F5E9' },
  sortBtnText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  sortBtnTextActive: { color: '#1B4332', fontWeight: '800' },

  // Content
  scrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20 },

  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  queueTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.8,
  },
  queueDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: 8,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRightColor: '#E5E7EB',
    borderTopColor: '#E5E7EB',
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardPriority: {
    backgroundColor: '#FAFFFE',
    borderColor: '#D1FAE5',
    borderRightColor: '#D1FAE5',
    borderTopColor: '#D1FAE5',
    borderBottomColor: '#D1FAE5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 4,
  },
  cardReportId: { fontSize: 12, fontWeight: '800', color: '#374151' },
  cardBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  severityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityText: { fontSize: 10, fontWeight: '800' },
  immediateActionBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  immediateActionText: { fontSize: 9, fontWeight: '800', color: '#B91C1C' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 3,
  },
  statusText: { fontSize: 9, color: '#B45309', fontWeight: '800' },

  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  animalIcon: { fontSize: 18, marginRight: 8 },
  conflictTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationIcon: { fontSize: 13, marginRight: 5 },
  locationText: { flex: 1, fontSize: 13, color: '#4B5563', fontWeight: '500' },

  description: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 12,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  timeIcon: { fontSize: 12, marginRight: 4 },
  timeText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  footerSep: { fontSize: 12, color: '#D1D5DB', marginHorizontal: 4 },
  reporterText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    flex: 1,
  },

  reviewBtn: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  // States
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorEmoji: { fontSize: 36, marginBottom: 12 },
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
    marginBottom: 20,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Dispatched row
  dispatchedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  dispatchedIcon: { fontSize: 20, marginRight: 12 },
  dispatchedTitle: { fontSize: 13, fontWeight: '700', color: '#374151' },
  dispatchedSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  dispatchedArrow: { fontSize: 20, color: '#6B7280' },

  // Bottom nav
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
    backgroundColor: '#A7F3D0',
    borderRadius: 20,
    marginHorizontal: 16,
  },
  navIcon: { fontSize: 20, marginBottom: 2, opacity: 0.6 },
  navIconActive: { fontSize: 20, marginBottom: 2 },
  navLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  navLabelActive: { fontSize: 11, color: '#065F46', fontWeight: '800' },
});

export default PendingReportsScreen;

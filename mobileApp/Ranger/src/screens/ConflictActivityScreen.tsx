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
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conflictApi, ConflictReport } from '../services/conflictApi';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { authService } from '../services/authService';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

interface ConflictActivityScreenProps {
  navigation: any;
}

type FilterStatus = 'All' | 'Verified' | 'Dispatched' | 'In Progress' | 'Resolved' | 'Rejected';

// ─── Design System Constants (Matches Operations & Reports) ─────────────────────

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

// ─── Filter Chip Component ────────────────────────────────────────────────────

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

// ─── Activity Card Component ──────────────────────────────────────────────────

const ActivityCard = ({
  report,
  onViewDetails,
}: {
  report: ConflictReport;
  onViewDetails: () => void;
}) => {
  const sevColor = SEVERITY_COLORS[report.severity] ?? '#6B7280';
  const sevBg = SEVERITY_BG[report.severity] ?? '#F3F4F6';
  const statusCfg =
    STATUS_CONFIG[report.status] ?? STATUS_CONFIG[report.status === 'False Alarm' ? 'Rejected' : 'Pending Verification'];

  const rangerName = report.assignedRangerId ? `Ranger ${report.assignedRangerId}` : 'Unassigned';

  return (
    <View style={[styles.card, { borderLeftColor: sevColor }]}>
      {/* Top Card Header: ID, Severity, Status */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardReportId}>#{report.reportId}</Text>
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
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>

      {/* Conflict Type & Animal */}
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

      {/* Status Specific Content Box */}
      {report.status === 'Dispatched' && (
        <View style={styles.statusContextBox}>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>ASSIGNED RANGER:</Text>
            <Text style={styles.contextValue}>{rangerName}</Text>
          </View>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>DISPATCH TIME:</Text>
            <Text style={styles.contextSubValue}>{formatTimeAgo(report.dispatchedAt || report.updatedAt)}</Text>
          </View>
        </View>
      )}

      {report.status === 'In Progress' && (
        <View style={[styles.statusContextBox, { borderLeftColor: '#0EA5E9', backgroundColor: '#F0F9FF' }]}>
          <View style={styles.contextRow}>
            <Text style={[styles.contextLabel, { color: '#0369A1' }]}>RANGER ON SITE:</Text>
            <Text style={styles.contextValue}>{rangerName}</Text>
          </View>
          {report.officerNotes ? (
            <Text style={styles.contextNotes} numberOfLines={2}>
              "{report.officerNotes}"
            </Text>
          ) : (
            <Text style={styles.contextNotes}>Active operations underway in field sector.</Text>
          )}
        </View>
      )}

      {report.status === 'Resolved' && (
        <View style={[styles.statusContextBox, { borderLeftColor: '#10B981', backgroundColor: '#ECFDF5' }]}>
          <View style={styles.contextRow}>
            <Text style={[styles.contextLabel, { color: '#047857' }]}>RESOLUTION STATUS:</Text>
            <Text style={[styles.contextValue, { color: '#065F46' }]}>
              Resolved ({formatTimeAgo(report.resolvedAt || report.updatedAt)})
            </Text>
          </View>
          <Text style={styles.contextNotes} numberOfLines={2}>
            "{report.actionTaken || report.resolutionNote || 'Incident resolved successfully by field team.'}"
          </Text>
        </View>
      )}

      {(report.status === 'Rejected' || report.status === 'False Alarm') && (
        <View style={[styles.statusContextBox, { borderLeftColor: '#EF4444', backgroundColor: '#FEF2F2' }]}>
          <Text style={[styles.contextLabel, { color: '#B91C1C', marginBottom: 2 }]}>REJECTION REASON:</Text>
          <Text style={[styles.contextNotes, { color: '#991B1B' }]}>
            {report.rejectionReason || 'Marked as False Alarm / Duplicate report during triage.'}
          </Text>
        </View>
      )}

      {report.status === 'Verified' && (
        <View style={[styles.statusContextBox, { borderLeftColor: '#3B82F6', backgroundColor: '#EFF6FF' }]}>
          <View style={styles.contextRow}>
            <Text style={[styles.contextLabel, { color: '#1E40AF' }]}>TRIAGE VERIFIED:</Text>
            <Text style={styles.contextValue}>{formatTimeAgo(report.verifiedAt || report.updatedAt)}</Text>
          </View>
          <Text style={[styles.contextNotes, { color: '#1E3A8A' }]}>
            {report.assignedRangerId ? `Assigned to Ranger ${report.assignedRangerId}` : 'Awaiting Ranger Dispatch'}
          </Text>
        </View>
      )}

      {/* Card Footer: Metadata & Action Button */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.timeIcon}>🕒</Text>
          <Text style={styles.timeText}>{formatTimeAgo(report.reportedAt)}</Text>
          <Text style={styles.footerSep}>•</Text>
          <Text style={styles.speciesText}>{report.animalSpecies}</Text>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={onViewDetails} activeOpacity={0.8}>
          <Text style={styles.actionBtnText}>VIEW DETAILS →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen Component ────────────────────────────────────────────────────

export const ConflictActivityScreen: React.FC<ConflictActivityScreenProps> = ({ navigation }) => {
  const { isConnected } = useNetworkStatus();

  // Data & UI states
  const [reports, setReports] = useState<ConflictReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');
  const [officerName, setOfficerName] = useState<string | null>(authService.userName);

  // Fetch real backend reports
  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      const result = await conflictApi.getConflictReports({
        sort: 'newest',
        limit: 200,
      });
      setReports(result.reports);
      if (authService.userName) {
        setOfficerName(authService.userName);
      }
    } catch (err: any) {
      setError('Unable to load activity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReports();
  }, [fetchReports]);

  // Refresh whenever screen gains focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchReports());
    return unsub;
  }, [navigation, fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  // Dynamic status counts for quick summary bar
  const stats = useMemo(() => {
    const inProgress = reports.filter((r) => r.status === 'In Progress').length;
    const dispatched = reports.filter((r) => r.status === 'Dispatched').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    return { inProgress, dispatched, resolved };
  }, [reports]);

  // Filtered reports calculation
  const filteredReports = useMemo(() => {
    let list = reports;

    // Status Filter
    if (activeFilter !== 'All') {
      if (activeFilter === 'Rejected') {
        list = list.filter((r) => r.status === 'Rejected' || r.status === 'False Alarm');
      } else {
        list = list.filter((r) => r.status === activeFilter);
      }
    }

    // Search Query Filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.reportId.toLowerCase().includes(q) ||
          r.conflictType.toLowerCase().includes(q) ||
          r.animalSpecies.toLowerCase().includes(q) ||
          r.locationName.toLowerCase().includes(q) ||
          (r.park && r.park.toLowerCase().includes(q)) ||
          (r.assignedRangerId && r.assignedRangerId.toLowerCase().includes(q))
      );
    }

    return list;
  }, [reports, search, activeFilter]);

  const filters: FilterStatus[] = ['All', 'Verified', 'Dispatched', 'In Progress', 'Resolved', 'Rejected'];

  const handleCardNavigation = (report: ConflictReport) => {
    if (['Dispatched', 'In Progress', 'Resolved'].includes(report.status)) {
      navigation.navigate('ActiveIncidentTracking', { reportId: report.reportId });
    } else {
      navigation.navigate('ConflictReportDetails', { reportId: report.reportId });
    }
  };

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
            <Text style={styles.brandSub}>Conflict Operations History</Text>
          </View>
        </View>
        <View style={styles.topRightControls}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{stats.inProgress + stats.dispatched}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigation.navigate('LiaisonOfficerProfile')}
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

      {/* ── 3. Quick Summary Stats Row ────────────────────────────────────── */}
      <View style={styles.summaryBar}>
        <View style={[styles.summaryPill, { borderColor: '#0EA5E9' }]}>
          <View style={[styles.summaryDot, { backgroundColor: '#0EA5E9' }]} />
          <Text style={styles.summaryLabel}>In Progress:</Text>
          <Text style={[styles.summaryCount, { color: '#0369A1' }]}>{stats.inProgress}</Text>
        </View>

        <View style={[styles.summaryPill, { borderColor: '#8B5CF6' }]}>
          <View style={[styles.summaryDot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={styles.summaryLabel}>Dispatched:</Text>
          <Text style={[styles.summaryCount, { color: '#6D28D9' }]}>{stats.dispatched}</Text>
        </View>

        <View style={[styles.summaryPill, { borderColor: '#10B981' }]}>
          <View style={[styles.summaryDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.summaryLabel}>Resolved:</Text>
          <Text style={[styles.summaryCount, { color: '#047857' }]}>{stats.resolved}</Text>
        </View>
      </View>

      {/* ── 4. Search Bar ─────────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Report ID, Type, Animal, Village, Ranger..."
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

      {/* ── 5. Horizontal Filter Chips ────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterStrip}
        contentContainerStyle={styles.filterStripContent}
      >
        {filters.map((f) => (
          <FilterChip
            key={f}
            label={f === 'All' ? 'All Activity' : f}
            active={activeFilter === f}
            onPress={() => setActiveFilter(f)}
          />
        ))}
      </ScrollView>

      {/* ── 6. Activity Content Area ───────────────────────────────────────── */}
      {loading && !refreshing ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.stateTitle}>Loading activity...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>Unable to load activity.</Text>
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
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>CONFLICT ACTIVITY LOG</Text>
            <Text style={styles.listCount}>
              {filteredReports.length} {filteredReports.length === 1 ? 'record' : 'records'}
            </Text>
          </View>

          {filteredReports.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No activity found.</Text>
              <Text style={styles.emptySubtitle}>
                No conflict reports match your selected search or filter criteria.
              </Text>
              {(search.length > 0 || activeFilter !== 'All') && (
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={() => {
                    setSearch('');
                    setActiveFilter('All');
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredReports.map((report) => (
              <ActivityCard
                key={report._id || report.reportId}
                report={report}
                onViewDetails={() => handleCardNavigation(report)}
              />
            ))
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Styles (Matching Operations & Reports Design System) ─────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // 1. Top Bar
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

  // 3. Quick Summary Bar
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  summaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    marginHorizontal: 3,
    borderWidth: 1,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    marginRight: 4,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '800',
  },

  // 4. Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '700',
  },

  // 5. Horizontal Filter Strip
  filterStrip: {
    maxHeight: 44,
  },
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
  chipActive: {
    backgroundColor: '#1B4332',
    borderColor: '#1B4332',
  },
  chipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // List Header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.8,
  },
  listCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Scroll Area
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // 6. Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
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
    marginBottom: 10,
  },
  cardReportId: {
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

  statusContextBox: {
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  contextLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  contextValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  contextSubValue: {
    fontSize: 11,
    color: '#6B7280',
  },
  contextNotes: {
    fontSize: 12,
    color: '#374151',
    fontStyle: 'italic',
    marginTop: 2,
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

  actionBtn: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
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
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 20,
    marginTop: 10,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  clearFiltersBtn: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#1B4332',
    fontSize: 12,
    fontWeight: '800',
  },

  // 7. Bottom Navigation (Identical to Operations & Reports)
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

export default ConflictActivityScreen;

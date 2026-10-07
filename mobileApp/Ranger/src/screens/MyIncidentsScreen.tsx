import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { IncidentCard } from '../components/IncidentCard';
import { LocalIncidentRecord } from '../types/incident';
import { SYNC_STATUS, SyncStatus } from '../constants/syncStatus';
import { IncidentStorageService } from '../services/incidentStorage';
import { incidentApi } from '../services/incidentApi';
import { conflictApi, ConflictReport } from '../services/conflictApi';
import { authService } from '../services/authService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useIncidentSync } from '../hooks/useIncidentSync';

type MainSection = 'LOGGED' | 'ASSIGNED';
type FilterType = 'ALL' | SyncStatus;
type ConflictFilterType = 'ALL' | 'Dispatched' | 'In Progress' | 'Resolved';

const ANIMAL_EMOJIS: Record<string, string> = {
  'Asian Elephant': '🐘',
  'Sri Lankan Leopard': '🐆',
  'Wild Boar': '🐗',
  'Sloth Bear': '🐻',
  'Mugger Crocodile': '🐊',
  Other: '⚠️',
};

const SEV_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  High: { bg: '#FEF2F2', text: '#EA580C', border: '#FDBA74' },
  Medium: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  Low: { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
};

interface MyIncidentsScreenProps {
  navigation: any;
  route?: any;
}

export const MyIncidentsScreen: React.FC<MyIncidentsScreenProps> = ({ navigation, route }) => {
  const { isConnected } = useNetworkStatus();
  const { triggerSync } = useIncidentSync();

  const [mainSection, setMainSection] = useState<MainSection>(
    route?.params?.initialTab === 'ASSIGNED' ? 'ASSIGNED' : 'LOGGED'
  );

  const [incidents, setIncidents] = useState<LocalIncidentRecord[]>([]);
  const [assignedConflicts, setAssignedConflicts] = useState<ConflictReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [conflictFilter, setConflictFilter] = useState<ConflictFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    setError(null);
    try {
      // 1. Load local incidents first (offline-first source of truth)
      const localList = await IncidentStorageService.getAllLocalIncidents();

      // 2. If online, fetch from backend and merge updates
      if (isConnected) {
        try {
          const remoteList = await incidentApi.getRangerIncidents('RN-402');
          // Merge remote records with local records
          for (const remote of remoteList) {
            const existing = localList.find(
              (item) => item.clientReferenceId === remote.clientReferenceId || item.backendId === remote.incidentId
            );
            if (!existing) {
              const newLocal: LocalIncidentRecord = {
                localId: remote.clientReferenceId || remote.incidentId,
                backendId: remote.incidentId,
                rangerId: remote.rangerId,
                rangerName: remote.rangerName,
                incidentType: remote.incidentType,
                latitude: remote.location?.latitude || 0,
                longitude: remote.location?.longitude || 0,
                accuracy: remote.location?.accuracy,
                addressSummary: remote.location?.addressSummary,
                description: remote.description,
                photoUri: remote.photoUrl,
                reportedAt: remote.reportedAt,
                syncStatus: SYNC_STATUS.SYNCED,
                syncAttempts: 1,
                createdAt: remote.createdAt,
                updatedAt: remote.updatedAt,
                clientReferenceId: remote.clientReferenceId || remote.incidentId,
              };
              await IncidentStorageService.saveIncident(newLocal);
              localList.push(newLocal);
            }
          }
        } catch {
          // Keep showing local records without failing
        }

        // 3. Fetch conflict reports assigned to this ranger by CLO
        try {
          const uid = authService.userId || undefined;
          const uName = authService.userName || undefined;
          const reports = await conflictApi.getRangerAssignedReports(uid, uName);
          setAssignedConflicts(reports);
        } catch {
          // Handled
        }
      }

      setIncidents(localList);
    } catch (err: any) {
      setError('Unable to load incidents from storage.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isConnected]);

  useEffect(() => {
    loadIncidents();
    const unsubscribe = navigation.addListener('focus', () => {
      loadIncidents();
    });
    return unsubscribe;
  }, [navigation, loadIncidents]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isConnected) {
      try {
        await triggerSync();
      } catch {
        // Handled
      }
    }
    await loadIncidents();
  };

  // Filter & Search Logic for Logged Incidents
  const filteredIncidents = incidents.filter((item) => {
    if (filter !== 'ALL' && item.syncStatus !== filter) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchType = item.incidentType.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchId = (item.backendId || item.localId).toLowerCase().includes(q);
      const matchLoc = (item.addressSummary || '').toLowerCase().includes(q);
      return matchType || matchDesc || matchId || matchLoc;
    }
    return true;
  });

  // Filter & Search Logic for Assigned Conflicts
  const filteredConflicts = assignedConflicts.filter((item) => {
    if (conflictFilter !== 'ALL' && item.status !== conflictFilter) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchSpecies = item.animalSpecies.toLowerCase().includes(q);
      const matchType = item.conflictType.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchId = item.reportId.toLowerCase().includes(q);
      const matchLoc = (item.locationName || '').toLowerCase().includes(q);
      const matchNotes = (item.officerNotes || '').toLowerCase().includes(q);
      return matchSpecies || matchType || matchDesc || matchId || matchLoc || matchNotes;
    }
    return true;
  });

  const getStatusCount = (targetFilter: FilterType) => {
    if (targetFilter === 'ALL') return incidents.length;
    return incidents.filter((item) => item.syncStatus === targetFilter).length;
  };

  const getConflictStatusCount = (targetFilter: ConflictFilterType) => {
    if (targetFilter === 'ALL') return assignedConflicts.length;
    return assignedConflicts.filter((item) => item.status === targetFilter).length;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Incident Operations"
        subtitle={mainSection === 'LOGGED' ? 'Field Patrol Log Book' : 'Dispatched Conflict Missions'}
        showConnectivity={true}
      />

      {/* Primary Section Switcher */}
      <View style={styles.sectionToggleContainer}>
        <TouchableOpacity
          style={[styles.sectionToggleBtn, mainSection === 'LOGGED' && styles.sectionToggleBtnActive]}
          onPress={() => {
            setMainSection('LOGGED');
            setSearchQuery('');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionToggleBtnText, mainSection === 'LOGGED' && styles.sectionToggleBtnTextActive]}>
            📋 My Logged ({incidents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sectionToggleBtn, mainSection === 'ASSIGNED' && styles.sectionToggleBtnActive]}
          onPress={() => {
            setMainSection('ASSIGNED');
            setSearchQuery('');
          }}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.sectionToggleBtnText, mainSection === 'ASSIGNED' && styles.sectionToggleBtnTextActive]}>
              🚨 Assigned Conflicts ({assignedConflicts.length})
            </Text>
            {assignedConflicts.filter((c) => ['Dispatched', 'In Progress'].includes(c.status)).length > 0 && (
              <View style={styles.activeDotBadge} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {mainSection === 'LOGGED' ? (
        <View style={styles.filterBar}>
          {(['ALL', SYNC_STATUS.SYNCED, SYNC_STATUS.PENDING, SYNC_STATUS.FAILED] as FilterType[]).map(
            (tab) => {
              const count = getStatusCount(tab);
              const isSelected = filter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterTab, isSelected && styles.filterTabSelected]}
                  onPress={() => setFilter(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterTabText, isSelected && styles.filterTabTextSelected]}>
                    {tab === 'ALL' ? 'All' : tab === 'PENDING' ? 'Pending' : tab === 'SYNCED' ? 'Synced' : 'Failed'}
                    {count > 0 ? ` (${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      ) : (
        <View style={styles.filterBar}>
          {(['ALL', 'Dispatched', 'In Progress', 'Resolved'] as ConflictFilterType[]).map(
            (tab) => {
              const count = getConflictStatusCount(tab);
              const isSelected = conflictFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterTab, isSelected && styles.filterTabSelected]}
                  onPress={() => setConflictFilter(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterTabText, isSelected && styles.filterTabTextSelected]}>
                    {tab}
                    {count > 0 ? ` (${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder={
            mainSection === 'LOGGED'
              ? 'Search by category, ID, location, or notes...'
              : 'Search by species, report ID, location, notes...'
          }
          placeholderTextColor={THEME.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Content State Handling */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading operational records...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorTitle}>Unable to load records</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadIncidents}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : mainSection === 'LOGGED' ? (
        <FlatList
          data={filteredIncidents}
          keyExtractor={(item) => item.localId}
          renderItem={({ item }) => (
            <IncidentCard
              incident={item}
              onPress={() =>
                navigation.navigate('IncidentDetails', {
                  incidentId: item.localId,
                  incident: item,
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[THEME.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery || filter !== 'ALL'
                  ? 'No matching incidents found'
                  : 'No incidents reported yet'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery || filter !== 'ALL'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Tap "+ Log Incident" from the Dashboard to record your first field report.'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredConflicts}
          keyExtractor={(item) => item._id || item.reportId}
          renderItem={({ item }) => {
            const sev = SEV_COLORS[item.severity] || SEV_COLORS.Medium;
            const emoji = ANIMAL_EMOJIS[item.animalSpecies] || '⚠️';
            const isDispatched = item.status === 'Dispatched';
            const isInProgress = item.status === 'In Progress';
            const isResolved = item.status === 'Resolved';

            return (
              <TouchableOpacity
                style={[
                  styles.conflictCard,
                  isDispatched && styles.conflictCardDispatched,
                  isInProgress && styles.conflictCardInProgress,
                ]}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('ActiveIncidentTracking', { reportId: item.reportId })}
              >
                <View style={styles.conflictCardHeader}>
                  <View style={styles.conflictHeaderLeft}>
                    <Text style={styles.conflictEmoji}>{emoji}</Text>
                    <View>
                      <Text style={styles.conflictSpecies}>{item.animalSpecies}</Text>
                      <Text style={styles.conflictReportId}>#{item.reportId}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.conflictSevBadge,
                      { backgroundColor: sev.bg, borderColor: sev.border },
                    ]}
                  >
                    <Text style={[styles.conflictSevText, { color: sev.text }]}>
                      {item.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.conflictDetailRow}>
                  <Text style={styles.conflictDetailIcon}>📍</Text>
                  <Text style={styles.conflictLocation}>{item.locationName} • {item.park}</Text>
                </View>

                {item.officerNotes ? (
                  <View style={styles.conflictNotesBox}>
                    <Text style={styles.conflictNotesIcon}>📻</Text>
                    <Text style={styles.conflictNotesText} numberOfLines={2}>
                      "{item.officerNotes}"
                    </Text>
                  </View>
                ) : null}

                <View style={styles.conflictFooter}>
                  <View
                    style={[
                      styles.conflictStatusPill,
                      isDispatched && { backgroundColor: '#FEF3C7' },
                      isInProgress && { backgroundColor: '#D1FAE5' },
                      isResolved && { backgroundColor: '#E5E7EB' },
                    ]}
                  >
                    <View
                      style={[
                        styles.conflictStatusDot,
                        isDispatched && { backgroundColor: '#F59E0B' },
                        isInProgress && { backgroundColor: '#10B981' },
                        isResolved && { backgroundColor: '#6B7280' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.conflictStatusText,
                        isDispatched && { color: '#B45309' },
                        isInProgress && { color: '#047857' },
                        isResolved && { color: '#4B5563' },
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.conflictRespondLink}>
                    {isDispatched ? 'Respond to Scene →' : 'View Tracking →'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[THEME.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery || conflictFilter !== 'ALL'
                  ? 'No matching conflict missions'
                  : 'No conflict missions assigned'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery || conflictFilter !== 'ALL'
                  ? 'Try clearing search terms or changing status filter.'
                  : 'When Community Liaison Officers dispatch you to wildlife conflicts, they will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.base,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
    gap: THEME.spacing.xs,
  },
  filterTab: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  filterTabSelected: {
    backgroundColor: THEME.colors.primary,
  },
  filterTabText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    fontWeight: '700',
  },
  filterTabTextSelected: {
    color: THEME.colors.textInverse,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.base,
    marginTop: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    minHeight: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: THEME.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: THEME.typography.sm,
    color: THEME.colors.textPrimary,
  },
  clearSearch: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    padding: 4,
  },
  listContent: {
    padding: THEME.spacing.base,
    paddingBottom: THEME.spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
  },
  loadingText: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.md,
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 36,
    color: THEME.colors.error,
    marginBottom: THEME.spacing.sm,
  },
  errorTitle: {
    fontSize: THEME.typography.base,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  errorSub: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    marginTop: 4,
    marginBottom: THEME.spacing.lg,
  },
  retryButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm + 2,
    borderRadius: THEME.radius.md,
  },
  retryButtonText: {
    color: THEME.colors.textInverse,
    fontWeight: '700',
    fontSize: THEME.typography.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xxl,
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: THEME.spacing.md,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: THEME.typography.base,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
    lineHeight: 18,
    maxWidth: 280,
  },
  // ── Segment Toggle Styles ──────────────────────────────────────────────────
  sectionToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    marginHorizontal: THEME.spacing.base,
    marginTop: THEME.spacing.sm,
    padding: 4,
    borderRadius: THEME.radius.md,
    gap: 4,
  },
  sectionToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radius.sm,
  },
  sectionToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  sectionToggleBtnTextActive: {
    color: '#1B4332',
    fontWeight: '800',
  },
  activeDotBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  // ── Conflict Cards Styles ──────────────────────────────────────────────────
  conflictCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  conflictCardDispatched: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF5',
  },
  conflictCardInProgress: {
    borderColor: '#10B981',
    backgroundColor: '#F7FEFA',
  },
  conflictCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  conflictHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  conflictEmoji: {
    fontSize: 26,
  },
  conflictSpecies: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  conflictReportId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 1,
  },
  conflictSevBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  conflictSevText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  conflictDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  conflictDetailIcon: {
    fontSize: 14,
  },
  conflictLocation: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  conflictNotesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  conflictNotesIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  conflictNotesText: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 16,
  },
  conflictFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  conflictStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  conflictStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  conflictStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  conflictRespondLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1B4332',
  },
});

export default MyIncidentsScreen;

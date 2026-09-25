import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { IncidentCard } from '../components/IncidentCard';
import { LocalIncidentRecord } from '../types/incident';
import { SYNC_STATUS, SyncStatus } from '../constants/syncStatus';
import { IncidentStorageService } from '../services/incidentStorage';
import { incidentApi } from '../services/incidentApi';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useIncidentSync } from '../hooks/useIncidentSync';

type FilterType = 'ALL' | SyncStatus;

interface MyIncidentsScreenProps {
  navigation: any;
}

export const MyIncidentsScreen: React.FC<MyIncidentsScreenProps> = ({ navigation }) => {
  const { isConnected } = useNetworkStatus();
  const { triggerSync } = useIncidentSync();

  const [incidents, setIncidents] = useState<LocalIncidentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
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

  // Filter & Search Logic
  const filteredIncidents = incidents.filter((item) => {
    // Status filter
    if (filter !== 'ALL' && item.syncStatus !== filter) {
      return false;
    }
    // Search filter
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

  const getStatusCount = (targetFilter: FilterType) => {
    if (targetFilter === 'ALL') return incidents.length;
    return incidents.filter((item) => item.syncStatus === targetFilter).length;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="My Incidents"
        subtitle="Ranger Log Book"
        showConnectivity={true}
      />

      {/* Filter Tabs */}
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

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search by category, ID, location, or notes..."
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
          <Text style={styles.loadingText}>Loading field incident logs...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorTitle}>Unable to load incidents</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadIncidents}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
});

export default MyIncidentsScreen;

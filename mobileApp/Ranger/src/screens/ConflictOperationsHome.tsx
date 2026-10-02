import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { conflictApi } from '../services/conflictApi';
import { authService } from '../services/authService';
import { AppHeader } from '../components/AppHeader';

interface ConflictOperationsHomeProps {
  navigation: any;
}

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

  const loadData = useCallback(async () => {
    try {
      setError(null);
      // Fetching for a specific park or all. We can pass park here if we have it.
      const data = await conflictApi.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError('Unable to load conflict reports.');
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

  const handleLogout = async () => {
    await authService.logout();
    navigation.replace('Login');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return '#DC2626';
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return '#FEE2E2';
      case 'High': return '#FEE2E2';
      case 'Medium': return '#FEF3C7';
      default: return '#D1FAE5';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER matching the screenshot design */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🛡</Text>
          </View>
          <View>
            <Text style={styles.brandName}>WildGuard Ops</Text>
            <Text style={styles.brandSub}>Conflict Operations</Text>
          </View>
        </View>
        <View style={styles.topRightControls}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}><Text style={styles.badgeText}>2</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarCircle} onPress={handleLogout}>
            <Text style={styles.avatarText}>
              {summary?.officer?.name ? summary.officer.name.substring(0, 2).toUpperCase() : 'CO'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠️ No internet connection. Showing cached or limited data.</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B4332']} />}
      >
        {/* DISPATCH CONSOLE - Officer Info */}
        <View style={styles.officerCard}>
          <View style={styles.officerHeader}>
            <Text style={styles.officerTag}>DISPATCH CONSOLE • LIVE FEED</Text>
            <TouchableOpacity style={styles.calendarBtn}>
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.officerGreeting}>Good morning, {summary?.officer?.name || 'Officer'}</Text>
          <View style={styles.officerLocation}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{summary?.officer?.assignedPark || 'Unknown Park'} - Active Duty</Text>
          </View>
        </View>

        {/* OPERATIONAL MANIFEST */}
        <View style={styles.manifestHeader}>
          <Text style={styles.sectionTitle}>Operational Manifest</Text>
          <Text style={styles.syncStatusText}>Auto-synced just now</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1B4332" />
            <Text style={styles.loadingText}>Loading conflict operations...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: '#F59E0B' }]}>
                <View style={styles.statHeader}>
                  <Text style={[styles.statIcon, { color: '#F59E0B' }]}>🕒</Text>
                  <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                </View>
                <Text style={styles.statNumber}>{summary?.stats?.pending || 0}</Text>
                <Text style={styles.statLabel}>PENDING</Text>
              </View>
              
              <View style={[styles.statCard, { borderColor: '#3B82F6' }]}>
                <View style={styles.statHeader}>
                  <Text style={[styles.statIcon, { color: '#3B82F6' }]}>🛡️</Text>
                  <View style={[styles.statDot, { backgroundColor: '#3B82F6' }]} />
                </View>
                <Text style={styles.statNumber}>{summary?.stats?.verified || 0}</Text>
                <Text style={styles.statLabel}>VERIFIED</Text>
              </View>
              
              <View style={[styles.statCard, { borderColor: '#8B5CF6' }]}>
                <View style={styles.statHeader}>
                  <Text style={[styles.statIcon, { color: '#8B5CF6' }]}>🚚</Text>
                  <View style={[styles.statDot, { backgroundColor: '#8B5CF6' }]} />
                </View>
                <Text style={styles.statNumber}>{summary?.stats?.dispatched || 0}</Text>
                <Text style={styles.statLabel}>DISPATCHED</Text>
              </View>
            </View>

            {/* NEEDS ATTENTION */}
            <View style={styles.needsAttentionHeader}>
              <View style={styles.needsAttentionTitleGroup}>
                <View style={styles.redDot} />
                <Text style={styles.sectionTitle}>Needs Attention</Text>
              </View>
              {summary?.reports?.filter((r: any) => r.severity === 'Critical' || r.severity === 'High').length > 0 && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalBadgeText}>
                    {summary.reports.filter((r: any) => r.severity === 'Critical' || r.severity === 'High').length} CRITICAL
                  </Text>
                </View>
              )}
            </View>

            {summary?.reports?.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No pending conflict reports.</Text>
              </View>
            ) : (
              summary?.reports?.map((report: any, index: number) => {
                const timeAgo = Math.max(1, Math.round((new Date().getTime() - new Date(report.reportedAt).getTime()) / 60000));
                
                return (
                  <View 
                    key={report.reportId || index} 
                    style={[
                      styles.reportCard, 
                      { borderLeftColor: getSeverityColor(report.severity) }
                    ]}
                  >
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportId}>#{report.reportId}</Text>
                      <View style={[styles.severityBadge, { backgroundColor: getSeverityBgColor(report.severity) }]}>
                        <Text style={[styles.severityText, { color: getSeverityColor(report.severity) }]}>
                          {report.severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.reportTitleRow}>
                      <Text style={styles.reportIcon}>
                        {report.animalSpecies === 'Asian Elephant' ? '🐘' : 
                         report.animalSpecies === 'Sri Lankan Leopard' ? '🐆' : 
                         report.animalSpecies === 'Wild Boar' ? '🐗' : 
                         report.animalSpecies === 'Mugger Crocodile' ? '🐊' : '⚠️'}
                      </Text>
                      <Text style={styles.reportTitle} numberOfLines={2}>
                        {report.conflictType}
                      </Text>
                      <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.reportDetailsBox}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📍</Text>
                        <Text style={styles.detailText} numberOfLines={1}>{report.locationName} ({report.park})</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>🕒</Text>
                        <Text style={styles.detailText}>{timeAgo} minutes ago</Text>
                      </View>
                    </View>
                    
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaIcon}>🐾</Text>
                        <Text style={styles.metaText}>{report.animalSpecies}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaTextCoord}>
                          {report.coordinates ? `${report.coordinates.latitude.toFixed(4)}° N, ${report.coordinates.longitude.toFixed(4)}° E` : 'GPS N/A'}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.reviewBtn}
                      onPress={() => navigation.navigate('IncidentDetails', { id: report.reportId })}
                    >
                      <Text style={styles.reviewBtnText}>REVIEW REPORT →</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('PendingReports')}>
              <Text style={styles.viewAllIcon}>📄</Text>
              <Text style={styles.viewAllText}>VIEW ALL PENDING REPORTS</Text>
              <View style={styles.viewAllBadge}>
                <Text style={styles.viewAllBadgeText}>{summary?.stats?.pending || 0}</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* BOTTOM NAVIGATION REPLACEMENT TO MATCH UI */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Text style={styles.navIconActive}>🛡</Text>
          <Text style={styles.navLabelActive}>Operations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PendingReports')}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navLabel}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AlertsTab')}>
          <Text style={styles.navIcon}>🕒</Text>
          <Text style={styles.navLabel}>Activity</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FB', // Light gray background
  },
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
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  logoIcon: {
    fontSize: 18,
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
  offlineBanner: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  offlineText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  officerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  officerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  officerTag: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  calendarBtn: {
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 6,
  },
  calendarIcon: {
    fontSize: 14,
  },
  officerGreeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  officerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  manifestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  syncStatusText: {
    fontSize: 11,
    color: '#6B7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
  },
  errorText: {
    color: '#991B1B',
    marginBottom: 12,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#991B1B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 18,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  needsAttentionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  needsAttentionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  criticalBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  criticalBadgeText: {
    color: '#B91C1C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRightColor: '#F3F4F6',
    borderTopColor: '#F3F4F6',
    borderBottomColor: '#F3F4F6',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  reportTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  reportDetailsBox: {
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 6,
    opacity: 0.7,
  },
  metaText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaTextCoord: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  reviewBtn: {
    backgroundColor: '#1B4332',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D6A4F',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  viewAllIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewAllBadge: {
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  viewAllBadgeText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '800',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20, // safe area padding approx
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
    opacity: 0.6,
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

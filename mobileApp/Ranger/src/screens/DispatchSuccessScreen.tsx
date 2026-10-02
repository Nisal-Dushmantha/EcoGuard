import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conflictApi, ConflictReport } from '../services/conflictApi';

interface DispatchSuccessScreenProps {
  navigation: any;
  route: { params: { reportId: string; rangerId: string; rangerName: string } };
}

export const DispatchSuccessScreen: React.FC<DispatchSuccessScreenProps> = ({
  navigation,
  route,
}) => {
  const { reportId, rangerId, rangerName } = route.params;

  const [report, setReport] = useState<ConflictReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await conflictApi.getConflictReportById(reportId);
      setReport(data);
    } catch (err: any) {
      setError('Dispatch completed, but the latest report details could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleViewStatus = () => {
    navigation.navigate('ActiveIncidentTracking', { reportId });
  };

  const handleBackToOps = () => {
    // Navigate back to the dashboard/operations home, which should trigger a refresh
    if (navigation.replace) {
      navigation.replace('ConflictOperationsHome');
    } else {
      navigation.navigate('ConflictOperationsHome');
    }
  };

  const formatTime = (dateString?: Date | string) => {
    if (!dateString) return 'Just now';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.centerText}>Loading dispatch manifest…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Failed to load details'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchReport}>
            <Text style={styles.retryBtnText}>RETRY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackToOps}>
            <Text style={styles.backBtnText}>BACK TO OPERATIONS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const shortRangerId = rangerId ? rangerId.slice(-4).toUpperCase() : 'R001';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTitleBox}>
          <View style={styles.shieldIconBox}>
            <Text style={styles.shieldIcon}>🛡️</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>WildGuard Ops</Text>
            <Text style={styles.headerSubtitle}>FIELD DISPATCH COMMAND</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerCloseBtn} onPress={handleBackToOps}>
          <Text style={styles.headerCloseText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* ── Success Header ──────────────────────────────────────────────── */}
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.title}>Ranger Dispatched</Text>
          <Text style={styles.subtitle}>
            Ranger {shortRangerId} ({rangerName}) has been successfully assigned to conflict report {report.reportId}.
          </Text>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>► STATUS: DISPATCHED</Text>
          </View>
        </View>

        {/* ── Operational Verification ────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.cardHeaderIcon}>✅</Text>
              <Text style={styles.cardTitle}>Operational Verification</Text>
            </View>
            <View style={styles.completeBadge}>
              <Text style={styles.completeBadgeText}>5 / 5 Complete</Text>
            </View>
          </View>

          <View style={styles.checklistItem}>
            <View style={styles.checklistCheck}><Text style={styles.checklistCheckText}>✓</Text></View>
            <Text style={styles.checklistText}>Report verified by {report.verifiedBy || 'Community Liaison Officer'}</Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={styles.checklistCheck}><Text style={styles.checklistCheckText}>✓</Text></View>
            <Text style={styles.checklistText}>Ranger {shortRangerId} assigned</Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={styles.checklistCheck}><Text style={styles.checklistCheckText}>✓</Text></View>
            <Text style={styles.checklistText}>Emergency VHF tone & telemetry alert broadcasted</Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={styles.checklistCheck}><Text style={styles.checklistCheckText}>✓</Text></View>
            <Text style={styles.checklistText}>Conflict report status updated to <Text style={styles.bold}>DISPATCHED</Text></Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={styles.checklistCheck}><Text style={styles.checklistCheckText}>✓</Text></View>
            <Text style={styles.checklistText}>Community liaison & village alert notification initiated</Text>
          </View>
        </View>

        {/* ── Dispatch Manifest ───────────────────────────────────────────── */}
        <View style={styles.manifestCard}>
          <View style={styles.manifestHeader}>
            <Text style={styles.manifestTitle}>DISPATCH MANIFEST</Text>
            <Text style={styles.manifestSubtitle}>{report.reportId} | LOG</Text>
          </View>

          <View style={styles.manifestRow}>
            <Text style={styles.manifestIcon}>⚠️</Text>
            <View style={styles.manifestDetails}>
              <Text style={styles.manifestLabel}>Incident</Text>
              <Text style={styles.manifestValueLarge}>{report.reportId}</Text>
              <Text style={styles.manifestValueSub}>
                {report.conflictType} ({report.animalSpecies}) / {report.locationName}
              </Text>
            </View>
          </View>

          <View style={styles.manifestDivider} />

          <View style={styles.manifestRow}>
            <Text style={styles.manifestIcon}>🛡️</Text>
            <View style={styles.manifestDetails}>
              <Text style={styles.manifestLabel}>Responding Officer</Text>
              <Text style={styles.manifestValue}>Ranger {shortRangerId} — {rangerName}</Text>
            </View>
          </View>

          <View style={styles.manifestDivider} />

          <View style={styles.manifestRow}>
            <Text style={styles.manifestIcon}>⏱️</Text>
            <View style={styles.manifestDetails}>
              <Text style={styles.manifestLabel}>Dispatch Time</Text>
              <Text style={styles.manifestValue}>{formatTime(report.dispatchedAt)}</Text>
            </View>
          </View>

          <View style={styles.manifestDivider} />

          <View style={styles.manifestRow}>
            <Text style={styles.manifestIcon}>👮</Text>
            <View style={styles.manifestDetails}>
              <Text style={styles.manifestLabel}>Dispatched By</Text>
              <Text style={styles.manifestValue}>{report.dispatchedBy || 'Community Liaison Officer'}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Bottom Actions ────────────────────────────────────────────────── */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleViewStatus}>
          <Text style={styles.primaryBtnText}>VIEW REPORT STATUS →</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleBackToOps}>
          <Text style={styles.secondaryBtnText}>← BACK TO OPERATIONS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F4FF' },
  bold: { fontWeight: 'bold' },
  scroll: { padding: 16, paddingBottom: 40 },
  
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centerText: { marginTop: 16, fontSize: 16, color: '#4B5563', fontWeight: '500' },
  
  errorIcon: { fontSize: 40, marginBottom: 16 },
  errorText: { fontSize: 16, color: '#B91C1C', textAlign: 'center', marginBottom: 24, fontWeight: '600' },
  retryBtn: { backgroundColor: '#1B4332', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 12 },
  retryBtnText: { color: '#FFF', fontWeight: '700' },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: '#4B5563', fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F0F4FF',
  },
  headerTitleBox: { flexDirection: 'row', alignItems: 'center' },
  shieldIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  shieldIcon: { fontSize: 20 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 9, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  headerCloseBtn: { padding: 8 },
  headerCloseText: { fontSize: 20, color: '#4B5563', fontWeight: '500' },

  // Success Header
  successHeader: { alignItems: 'center', marginVertical: 20 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#A7F3D0', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 8, borderColor: '#D1FAE5' },
  checkIcon: { fontSize: 36, color: '#065F46', fontWeight: '900' },
  title: { fontSize: 24, fontWeight: '800', color: '#1E3A8A', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#4B5563', textAlign: 'center', paddingHorizontal: 24, marginBottom: 20, lineHeight: 20 },
  statusPill: { backgroundColor: '#DBEAFE', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusPillText: { color: '#1D4ED8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // Cards
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardHeaderIcon: { fontSize: 16, marginRight: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  completeBadge: { backgroundColor: '#A7F3D0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  completeBadgeText: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  
  checklistItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checklistCheck: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#A7F3D0', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  checklistCheckText: { fontSize: 10, color: '#065F46', fontWeight: 'bold' },
  checklistText: { fontSize: 12, color: '#4B5563', flex: 1, lineHeight: 18 },

  manifestCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: '#047857', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  manifestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  manifestTitle: { fontSize: 11, fontWeight: '800', color: '#374151', letterSpacing: 0.5 },
  manifestSubtitle: { fontSize: 10, fontWeight: '700', color: '#9CA3AF' },
  
  manifestRow: { flexDirection: 'row', alignItems: 'flex-start' },
  manifestIcon: { fontSize: 16, marginRight: 16, marginTop: 2 },
  manifestDetails: { flex: 1 },
  manifestLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  manifestValueLarge: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  manifestValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
  manifestValueSub: { fontSize: 12, color: '#4B5563' },
  manifestDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16, marginLeft: 32 },

  // Bottom Actions
  bottomActions: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 12 },
  primaryBtn: { backgroundColor: '#1B4332', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  secondaryBtn: { backgroundColor: '#F9FAFB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryBtnText: { color: '#4B5563', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
});

export default DispatchSuccessScreen;

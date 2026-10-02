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

interface AvailableRangerSelectionProps {
  navigation: any;
  route: { params: { reportId: string; report?: ConflictReport } };
}

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#DC2626', High: '#EF4444', Medium: '#F59E0B', Low: '#10B981',
};
const SEVERITY_BG: Record<string, string> = {
  Critical: '#FEE2E2', High: '#FFF0F0', Medium: '#FEF3C7', Low: '#D1FAE5',
};

export const AvailableRangerSelection: React.FC<AvailableRangerSelectionProps> = ({
  navigation,
  route,
}) => {
  const { reportId, report: passedReport } = route.params;

  const [report, setReport] = useState<ConflictReport | null>(passedReport ?? null);
  const [reportLoading, setReportLoading] = useState(!passedReport);
  
  const [rangers, setRangers] = useState<any[]>([]);
  const [rangersLoading, setRangersLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch report if needed
    if (!passedReport) {
      conflictApi.getConflictReportById(reportId)
        .then(data => setReport(data))
        .catch(err => setFetchError('Failed to load report.'))
        .finally(() => setReportLoading(false));
    }
    
    // Fetch rangers
    conflictApi.getAvailableRangers()
      .then(data => setRangers(data))
      .catch(err => setFetchError('Failed to load available rangers.'))
      .finally(() => setRangersLoading(false));
  }, [reportId, passedReport]);

  const handleSelectRanger = (ranger: any) => {
    navigation.navigate('ConfirmAssignment', {
      reportId,
      rangerId: ranger._id,
      rangerName: ranger.name,
      report
    });
  };

  if (reportLoading || rangersLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Select Ranger</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.stateText}>Loading data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (fetchError || !report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Select Ranger</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.stateBox}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>{fetchError || 'Report not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>← GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sevColor = SEVERITY_COLOR[report.severity] ?? '#6B7280';
  const sevBg = SEVERITY_BG[report.severity] ?? '#F9FAFB';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerSubtitle}>WILDGUARD OPS - UC03</Text>
          <Text style={styles.headerTitle}>Select Ranger</Text>
        </View>
        <View style={styles.headerIconBox}>
          <Text style={styles.headerIcon}>🛡️</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* ── Step Indicator ────────────────────────────────────────────────── */}
        <View style={styles.stepContainer}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCompleted]}>
              <Text style={styles.stepCheck}>✓</Text>
            </View>
            <View>
              <Text style={styles.stepTextActive}>Step 1</Text>
              <Text style={styles.stepTextActiveMain}>Verify</Text>
            </View>
          </View>
          <View style={styles.stepLineActive} />
          
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCurrent]}>
              <Text style={styles.stepCurrentNum}>2</Text>
            </View>
            <View>
              <Text style={styles.stepTextActive}>Step 2</Text>
              <Text style={styles.stepTextActiveMain}>Select</Text>
            </View>
          </View>
          <View style={styles.stepLineInactive} />

          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepInactive]}>
              <Text style={styles.stepCurrentNum}>3</Text>
            </View>
            <View>
              <Text style={styles.stepTextInactive}>Step 3</Text>
              <Text style={styles.stepTextInactiveMain}>Dispatch</Text>
            </View>
          </View>
        </View>

        {/* ── Context Card ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>INCIDENT DISPATCH CONTEXT</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>📄 INCIDENT REPORT {report.reportId}</Text>
            <View style={[styles.severityPill, { backgroundColor: sevBg }]}>
              <Text style={[styles.severityPillText, { color: sevColor }]}>■ {report.severity.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.reportTitle}>{report.conflictType}</Text>
          <Text style={styles.reportLocation}>📍 {report.locationName} ({report.park})</Text>

          {/* Tactical Proximity Map Placeholder */}
          <View style={styles.mapBox}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapText}>Tactical Proximity Map</Text>
          </View>
        </View>

        {/* ── Rangers List ──────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>AVAILABLE RANGERS (NEARBY)</Text>
        
        {rangers.map((ranger, idx) => {
          const initials = ranger.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
          
          return (
            <View key={idx} style={styles.rangerCard}>
              <View style={styles.rangerCardTop}>
                <View style={styles.rangerAvatar}>
                  <Text style={styles.rangerInitials}>{initials}</Text>
                </View>
                <View style={styles.rangerDetails}>
                  <Text style={styles.rangerNameText}>{ranger.name}</Text>
                  <Text style={styles.rangerIdText}>{ranger.specialty || 'Field Specialist'}</Text>
                </View>
                <View style={styles.badgeBox}>
                  <Text style={styles.badgeText}>● {ranger.status}</Text>
                </View>
              </View>

              <View style={styles.rangerCardMiddle}>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>🧭</Text>
                  <View>
                    <Text style={styles.statLabel}>Distance</Text>
                    <Text style={styles.statValue}>{ranger.distance}</Text>
                  </View>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statIcon}>⏱️</Text>
                  <View>
                    <Text style={styles.statLabel}>ETA</Text>
                    <Text style={styles.statValue}>{ranger.eta}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.selectBtn} 
                onPress={() => handleSelectRanger(ranger)}
              >
                <Text style={styles.selectBtnText}>SELECT {initials}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  bold: { fontWeight: 'bold' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  headerBackBtn: { paddingRight: 16 },
  headerBackText: { fontSize: 24, color: '#374151' },
  headerTitleBox: { flex: 1 },
  headerSubtitle: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  headerIconBox: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
  },
  headerIcon: { fontSize: 16 },

  scroll: { paddingHorizontal: 16, paddingBottom: 24 },

  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
  },
  stepCompleted: { backgroundColor: '#10B981' },
  stepCurrent: { backgroundColor: '#1B4332' },
  stepInactive: { backgroundColor: '#E5E7EB' },
  stepCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  stepCurrentNum: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  stepTextActive: { fontSize: 9, color: '#1B4332', fontWeight: '700' },
  stepTextActiveMain: { fontSize: 11, color: '#1B4332', fontWeight: '800' },
  stepTextInactive: { fontSize: 9, color: '#6B7280', fontWeight: '700' },
  stepTextInactiveMain: { fontSize: 11, color: '#6B7280', fontWeight: '800' },
  stepLineActive: { flex: 1, height: 2, backgroundColor: '#10B981', marginHorizontal: 8 },
  stepLineInactive: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 8 },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#4B5563', marginBottom: 12, marginTop: 8 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  severityPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  severityPillText: { fontSize: 9, fontWeight: '800' },
  reportTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 },
  reportLocation: { fontSize: 13, color: '#4B5563', fontWeight: '500', marginBottom: 16 },

  mapBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon: { fontSize: 24, marginBottom: 8 },
  mapText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },

  rangerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  rangerCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rangerAvatar: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  rangerInitials: { fontSize: 18, fontWeight: '800', color: '#4B5563' },
  rangerDetails: { flex: 1 },
  rangerNameText: { fontSize: 15, fontWeight: '800', color: '#111827' },
  rangerIdText: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  badgeBox: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#065F46' },

  rangerCardMiddle: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6',
  },
  statIcon: { fontSize: 16, marginRight: 10 },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  statValue: { fontSize: 12, color: '#111827', fontWeight: '800' },

  selectBtn: {
    backgroundColor: '#1B4332',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // Top states
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 20, fontWeight: '700' },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  stateEmoji: { fontSize: 40, marginBottom: 16 },
  stateTitle: { fontSize: 16, fontWeight: '700', marginBottom: 20 },
  stateText: { marginTop: 12, color: '#6B7280' },
  retryBtn: { backgroundColor: '#1B4332', padding: 12, borderRadius: 10 },
  retryBtnText: { color: '#FFF', fontWeight: '700' },
});

export default AvailableRangerSelection;

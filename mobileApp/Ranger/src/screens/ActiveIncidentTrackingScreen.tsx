import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conflictApi, ConflictReport } from '../services/conflictApi';

interface ActiveIncidentTrackingScreenProps {
  route: any;
  navigation: any;
}

export const ActiveIncidentTrackingScreen: React.FC<ActiveIncidentTrackingScreenProps> = ({ route, navigation }) => {
  const { reportId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ConflictReport | null>(null);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [updateNote, setUpdateNote] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const loadReport = useCallback(async () => {
    if (!reportId) return;
    try {
      const data = await conflictApi.getConflictReportById(reportId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load report.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadReport();
    const unsubscribe = navigation.addListener('focus', () => {
      loadReport();
    });
    return unsubscribe;
  }, [navigation, loadReport]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReport();
  };

  const handleUpdateStatus = async () => {
    if (!report || !newStatus) return;
    setUpdateLoading(true);
    try {
      await conflictApi.updateConflictStatus(report.reportId, newStatus, updateNote);
      setModalVisible(false);
      setNewStatus('');
      setUpdateNote('');
      loadReport();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  const openUpdateModal = () => {
    if (!report) return;
    // Determine next logical status
    if (report.status === 'Dispatched') setNewStatus('In Progress');
    else if (report.status === 'In Progress') setNewStatus('Resolved');
    else setNewStatus('');
    setUpdateNote('');
    setModalVisible(true);
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerBox}>
        <ActivityIndicator size="large" color="#1B4332" />
        <Text style={styles.loadingText}>Loading report data...</Text>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={styles.centerBox}>
        <Text style={styles.errorText}>{error || 'Unable to load report.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadReport}>
          <Text style={styles.retryBtnText}>RETRY</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Calculate timeline states
  const isVerified = !!report.verifiedAt;
  const isAssigned = !!report.assignedRangerId;
  const isDispatched = !!report.dispatchedAt;
  const isInProgress = !!report.inProgressAt;
  const isResolved = !!report.resolvedAt;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Report Status </Text>
            <View style={styles.headerIdBadge}>
              <Text style={styles.headerIdText}>#{report.reportId}</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>WildGuard Ops • Operational Tracking</Text>
        </View>
        <View style={styles.headerRightControls}>
          <Text style={styles.headerIcon}>🛡️</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B4332']} />}
      >
        {/* TITLE CARD */}
        <View style={styles.titleCard}>
          <View style={styles.titleCardBadges}>
            <Text style={styles.trackerText}>TRACKER #{report.reportId}</Text>
            <View style={styles.severityBadge}>
              <Text style={styles.severityText}>SEVERITY: {report.severity.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.conflictTitle}>{report.conflictType}</Text>
          <View style={styles.locationStatusRow}>
            <View style={styles.locationGroup}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{report.locationName}</Text>
            </View>
            <View style={styles.statusBadgeGreen}>
              <Text style={styles.statusBadgeTextGreen}>🟢 {report.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* TIMELINE */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>📈 Operational Incident Timeline</Text>
            <Text style={styles.liveSyncText}>🟢 Live Sync</Text>
          </View>
          <View style={styles.timelineContainer}>
            {/* RECEIVED */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLine} />
              <View style={styles.timelineDotDone}><Text style={styles.timelineCheck}>✓</Text></View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineTitle}>RECEIVED</Text>
                  <Text style={styles.timelineTime}>✓ {formatTime(report.reportedAt)}</Text>
                </View>
                <Text style={styles.timelineSub}>Reported via Community Liaison Hotline</Text>
              </View>
            </View>

            {/* VERIFIED */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLine} />
              <View style={isVerified ? styles.timelineDotDone : styles.timelineDotPending}>
                {isVerified ? <Text style={styles.timelineCheck}>✓</Text> : <View style={styles.timelineDotInner} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={[styles.timelineTitle, !isVerified && styles.textPending]}>VERIFIED</Text>
                  <Text style={styles.timelineTime}>{isVerified ? `✓ ${formatTime(report.verifiedAt)}` : 'Pending'}</Text>
                </View>
                <Text style={styles.timelineSub}>
                  {isVerified ? `Verified by ${report.verifiedBy}` : 'Awaiting verification'}
                </Text>
              </View>
            </View>

            {/* RANGER ASSIGNED */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLine} />
              <View style={isAssigned ? styles.timelineDotDone : styles.timelineDotPending}>
                {isAssigned ? <Text style={styles.timelineCheck}>✓</Text> : <View style={styles.timelineDotInner} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={[styles.timelineTitle, !isAssigned && styles.textPending]}>RANGER ASSIGNED</Text>
                  <Text style={styles.timelineTime}>{isAssigned ? `✓ ${formatTime(report.dispatchedAt)}` : 'Pending'}</Text>
                </View>
                <Text style={styles.timelineSub}>
                  {isAssigned ? `Assigned to Ranger ID: ${report.assignedRangerId}` : 'Awaiting assignment'}
                </Text>
              </View>
            </View>

            {/* DISPATCHED */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLine} />
              <View style={isDispatched ? (report.status === 'Dispatched' ? styles.timelineDotActive : styles.timelineDotDone) : styles.timelineDotPending}>
                {isDispatched ? (report.status === 'Dispatched' ? <Text style={styles.timelineRadioIcon}>📻</Text> : <Text style={styles.timelineCheck}>✓</Text>) : <View style={styles.timelineDotInner} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.timelineTitle, !isDispatched && styles.textPending]}>DISPATCHED</Text>
                    {report.status === 'Dispatched' && <View style={styles.activeTag}><Text style={styles.activeTagText}>ACTIVE</Text></View>}
                  </View>
                  <Text style={styles.timelineTime}>{isDispatched ? `✓ ${formatTime(report.dispatchedAt)}` : 'Pending'}</Text>
                </View>
                <Text style={styles.timelineSub}>
                  {isDispatched ? `Dispatched by ${report.dispatchedBy}` : 'Awaiting dispatch'}
                </Text>
              </View>
            </View>

            {/* IN PROGRESS */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLine} />
              <View style={isInProgress ? (report.status === 'In Progress' ? styles.timelineDotActive : styles.timelineDotDone) : styles.timelineDotPending}>
                {isInProgress ? (report.status === 'In Progress' ? <Text style={styles.timelineRadioIcon}>⏳</Text> : <Text style={styles.timelineCheck}>✓</Text>) : <View style={styles.timelineDotInner} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.timelineTitle, !isInProgress && styles.textPending]}>IN PROGRESS</Text>
                    {report.status === 'In Progress' && <View style={styles.activeTag}><Text style={styles.activeTagText}>ACTIVE</Text></View>}
                  </View>
                  <Text style={styles.timelineTime}>{isInProgress ? `✓ ${formatTime(report.inProgressAt)}` : 'Estimated...'}</Text>
                </View>
                <Text style={styles.timelineSub}>
                  {isInProgress ? 'En route / perimeter arrival' : 'Pending'}
                </Text>
              </View>
            </View>

            {/* RESOLVED */}
            <View style={[styles.timelineItem, { marginBottom: 0 }]}>
              <View style={isResolved ? styles.timelineDotDone : styles.timelineDotPending}>
                {isResolved ? <Text style={styles.timelineCheck}>✓</Text> : <View style={styles.timelineDotInner} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={[styles.timelineTitle, !isResolved && styles.textPending]}>RESOLVED</Text>
                  <Text style={styles.timelineTime}>{isResolved ? `✓ ${formatTime(report.resolvedAt)}` : 'Pending mitigation'}</Text>
                </View>
                <Text style={styles.timelineSub}>
                  {isResolved ? report.resolutionNote || 'Incident resolved.' : 'Awaiting resolution'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ASSIGNED RESPONDER */}
        <View style={styles.card}>
          <View style={styles.responderHeaderRow}>
            <Text style={styles.responderHeader}>ASSIGNED RESPONDER</Text>
            <Text style={styles.enRouteText}>
              {report.status === 'Dispatched' ? '🟢 EN ROUTE' : (report.status === 'In Progress' ? '🟢 ON SITE' : (report.status === 'Resolved' ? '⚪ COMPLETED' : '⚪ PENDING'))}
            </Text>
          </View>
          
          <View style={styles.responderInfoRow}>
            <View style={styles.responderAvatar}>
              <Text style={styles.responderAvatarText}>RN</Text>
            </View>
            <View style={styles.responderDetails}>
              <Text style={styles.responderName}>Ranger ID: {report.assignedRangerId || 'Unassigned'}</Text>
              <Text style={styles.responderSub}>Rapid Response Unit</Text>
            </View>
          </View>

          <View style={styles.commsRow}>
            <TouchableOpacity style={styles.commsBtn}>
              <Text style={styles.commsBtnIcon}>📞</Text>
              <Text style={styles.commsBtnText}>Call Ranger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commsBtn}>
              <Text style={styles.commsBtnIcon}>📻</Text>
              <Text style={styles.commsBtnText}>VHF Channel 4</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.uiOnlyNotice}>* Comm actions are UI-only.</Text>
        </View>

        {/* FIELD ASSESSMENT */}
        <View style={styles.card}>
          <View style={styles.assessmentHeader}>
            <Text style={styles.assessmentTitle}>Field Assessment &{'\n'}Perimeter</Text>
            <View style={styles.zoneBadge}>
              <Text style={styles.zoneBadgeText}>Zone 4B{'\n'}Buffer</Text>
            </View>
          </View>

          <View style={styles.assessmentGrid}>
            <View style={styles.assessmentBox}>
              <Text style={styles.boxLabel}>Target Wildlife</Text>
              <Text style={styles.boxValue}>{report.animalSpecies}</Text>
              <Text style={styles.boxWarning}>Detection Active</Text>
            </View>
            <View style={styles.assessmentBox}>
              <Text style={styles.boxLabel}>Perimeter Risk</Text>
              <Text style={styles.boxValue}>Active Zone</Text>
              <Text style={styles.boxSubValue}>Corridor Proximity</Text>
            </View>
          </View>

          <View style={styles.logBox}>
            <Text style={styles.logBoxTitle}>📄 FIELD OBSERVATION LOG</Text>
            <Text style={styles.logBoxText}>{report.description}</Text>
            {report.officerNotes ? (
              <Text style={[styles.logBoxText, { marginTop: 8, fontStyle: 'italic' }]}>
                Updates: {report.officerNotes}
              </Text>
            ) : null}
          </View>

          {/* Fake Map Section */}
          <View style={styles.mapContainer}>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>Map Coordinate: {report.coordinates?.latitude || 'N/A'}, {report.coordinates?.longitude || 'N/A'}</Text>
              <TouchableOpacity style={styles.expandMapBtn}>
                <Text style={styles.expandMapText}>⛶ Expand Tactical Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTIONS */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.updateLogBtn} onPress={openUpdateModal}>
          <Text style={styles.updateLogIcon}>✏️</Text>
          <Text style={styles.updateLogText}>UPDATE INCIDENT{'\n'}LOG</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.radioBtn}>
          <Text style={styles.radioBtnIcon}>📻</Text>
          <Text style={styles.radioBtnText}>RADIO DISPATCH{'\n'}COMMS</Text>
        </TouchableOpacity>
      </View>

      {/* UPDATE MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Incident Status</Text>
            
            <View style={styles.statusOptions}>
              {report?.status === 'Dispatched' && (
                <TouchableOpacity 
                  style={[styles.statusOption, newStatus === 'In Progress' && styles.statusOptionActive]}
                  onPress={() => setNewStatus('In Progress')}
                >
                  <Text style={[styles.statusOptionText, newStatus === 'In Progress' && styles.statusOptionTextActive]}>IN PROGRESS</Text>
                </TouchableOpacity>
              )}
              {report?.status === 'In Progress' && (
                <TouchableOpacity 
                  style={[styles.statusOption, newStatus === 'Resolved' && styles.statusOptionActive]}
                  onPress={() => setNewStatus('Resolved')}
                >
                  <Text style={[styles.statusOptionText, newStatus === 'Resolved' && styles.statusOptionTextActive]}>RESOLVED</Text>
                </TouchableOpacity>
              )}
              {report?.status !== 'Dispatched' && report?.status !== 'In Progress' && (
                <Text style={styles.modalText}>No valid transitions available from {report?.status}.</Text>
              )}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter operational note (optional)"
              value={updateNote}
              onChangeText={setUpdateNote}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)} disabled={updateLoading}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleUpdateStatus} disabled={!newStatus || updateLoading}>
                <Text style={styles.modalBtnTextConfirm}>{updateLoading ? 'Saving...' : 'Confirm Update'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#4B5563', fontWeight: '500' },
  errorText: { fontSize: 14, color: '#DC2626', fontWeight: '600', marginBottom: 16 },
  retryBtn: { backgroundColor: '#1B4332', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800' },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 24, color: '#374151', fontWeight: '600' },
  headerTitleBox: { alignItems: 'center' },
  headerLogo: { fontSize: 14, marginRight: 4 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  headerIdBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  headerIdText: { fontSize: 10, color: '#1D4ED8', fontWeight: '800' },
  headerSubtitle: { fontSize: 10, color: '#4B5563', marginTop: 2, fontWeight: '600' },
  headerRightControls: { flexDirection: 'row' },
  headerIcon: { fontSize: 18, color: '#4B5563' },

  scrollContent: { padding: 16, paddingBottom: 100 },

  titleCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#047857', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  titleCardBadges: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  trackerText: { fontSize: 10, fontWeight: '800', color: '#047857', letterSpacing: 0.5 },
  severityBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  severityText: { fontSize: 9, color: '#B91C1C', fontWeight: '800' },
  conflictTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
  locationStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationGroup: { flexDirection: 'row', alignItems: 'center' },
  locationIcon: { fontSize: 14, marginRight: 4 },
  locationText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  statusBadgeGreen: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  statusBadgeTextGreen: { fontSize: 10, fontWeight: '800', color: '#065F46' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  liveSyncText: { fontSize: 10, fontWeight: '700', color: '#047857' },

  timelineContainer: { paddingLeft: 10 },
  timelineItem: { flexDirection: 'row', marginBottom: 20, position: 'relative' },
  timelineLine: { position: 'absolute', left: 11, top: 24, bottom: -20, width: 2, backgroundColor: '#E5E7EB' },
  timelineDotDone: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineDotActive: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E0F2FE', borderWidth: 2, borderColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineDotPending: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  timelineCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  timelineRadioIcon: { fontSize: 12 },
  timelineContent: { flex: 1, marginLeft: 16 },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  timelineTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  textPending: { color: '#9CA3AF' },
  activeTag: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  activeTagText: { fontSize: 9, color: '#047857', fontWeight: '800' },
  timelineTime: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  timelineSub: { fontSize: 12, color: '#6B7280' },

  responderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  responderHeader: { fontSize: 11, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  enRouteText: { fontSize: 10, fontWeight: '800', color: '#047857' },
  responderInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  responderAvatar: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  responderAvatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  responderDetails: { flex: 1 },
  responderName: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 2 },
  responderSub: { fontSize: 12, color: '#6B7280' },
  commsRow: { flexDirection: 'row', gap: 12 },
  commsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8 },
  commsBtnIcon: { fontSize: 16, marginRight: 8 },
  commsBtnText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  uiOnlyNotice: { fontSize: 10, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic', textAlign: 'center' },

  assessmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  assessmentTitle: { fontSize: 14, fontWeight: '800', color: '#111827', lineHeight: 20 },
  zoneBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  zoneBadgeText: { fontSize: 10, fontWeight: '800', color: '#4F46E5', textAlign: 'center' },
  assessmentGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  assessmentBox: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 8, padding: 12 },
  boxLabel: { fontSize: 10, color: '#6B7280', fontWeight: '800', marginBottom: 4 },
  boxValue: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 4 },
  boxWarning: { fontSize: 11, color: '#DC2626', fontWeight: '700' },
  boxSubValue: { fontSize: 11, color: '#D97706', fontWeight: '700' },
  logBox: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16 },
  logBoxTitle: { fontSize: 10, fontWeight: '800', color: '#6B7280', marginBottom: 6 },
  logBoxText: { fontSize: 12, color: '#374151', lineHeight: 18 },
  mapContainer: { height: 140, borderRadius: 8, overflow: 'hidden', backgroundColor: '#E5E7EB' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#879F84' },
  mapPlaceholderText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginBottom: 12 },
  expandMapBtn: { backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  expandMapText: { fontSize: 11, fontWeight: '800', color: '#111827' },

  bottomBar: { flexDirection: 'row', position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  updateLogBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1B4332', borderRadius: 8, paddingVertical: 10 },
  updateLogIcon: { fontSize: 18, marginRight: 8 },
  updateLogText: { fontSize: 10, fontWeight: '800', color: '#1B4332', textAlign: 'center' },
  radioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B4332', borderRadius: 8, paddingVertical: 10 },
  radioBtnIcon: { fontSize: 18, marginRight: 8, color: '#FFFFFF' },
  radioBtnText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', width: '85%', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 16 },
  modalText: { fontSize: 13, color: '#4B5563', marginBottom: 16 },
  statusOptions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statusOption: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, alignItems: 'center' },
  statusOptionActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  statusOptionText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  statusOptionTextActive: { color: '#065F46' },
  modalInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, height: 80, textAlignVertical: 'top', marginBottom: 16, fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  modalBtnTextCancel: { color: '#6B7280', fontWeight: '700' },
  modalBtnConfirm: { backgroundColor: '#1B4332', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalBtnTextConfirm: { color: '#FFFFFF', fontWeight: '700' },
});

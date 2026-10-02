import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conflictApi, ConflictReport } from '../services/conflictApi';
import { authService } from '../services/authService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfirmAssignmentScreenProps {
  navigation: any;
  route: { params: { reportId: string; rangerId: string; rangerName: string; report?: ConflictReport } };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#DC2626', High: '#EF4444', Medium: '#F59E0B', Low: '#10B981',
};
const SEVERITY_BG: Record<string, string> = {
  Critical: '#FEE2E2', High: '#FFF0F0', Medium: '#FEF3C7', Low: '#D1FAE5',
};

const DispatchModal = ({
  visible,
  reportId,
  rangerId,
  rangerName,
  report,
  notes,
  onClose,
  onConfirm,
  loading,
}: {
  visible: boolean;
  reportId: string;
  rangerId: string;
  rangerName: string;
  report: ConflictReport;
  notes: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => {
  const sevColor = SEVERITY_COLOR[report.severity] ?? '#6B7280';
  const sevBg = SEVERITY_BG[report.severity] ?? '#FEE2E2';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCardExtended}>
          <View style={styles.modalShieldBox}>
            <Text style={styles.modalShieldIcon}>🛡️</Text>
          </View>

          <Text style={styles.modalTitleLarge}>Dispatch Ranger {rangerId.slice(-4)}?</Text>
          
          <Text style={styles.modalMessageExtended}>
            Ranger <Text style={styles.bold}>{rangerId.slice(-4)}</Text> ({rangerName}) will be assigned and dispatched to conflict report <Text style={[styles.bold, { color: '#047857' }]}>{report.reportId}</Text> at <Text style={styles.bold}>{report.locationName}</Text>.
          </Text>

          <View style={styles.modalDetailCard}>
            <View style={styles.modalDetailHeaderRow}>
              <Text style={styles.modalDetailFileIcon}>📄</Text>
              <Text style={styles.modalDetailDestLabel}>Destination</Text>
              <Text style={styles.modalDetailDestValue}>{report.locationName}, {report.park}</Text>
            </View>

            <View style={styles.modalDetailDivider} />

            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailLabelBox}>
                <Text style={styles.modalDetailIcon}>📻</Text>
                <Text style={styles.modalDetailLabel}>Radio Channel</Text>
              </View>
              <Text style={styles.modalDetailValueGreen}>● Encrypted VHF Channel 4</Text>
            </View>

            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailLabelBox}>
                <Text style={styles.modalDetailIcon}>⚠️</Text>
                <Text style={styles.modalDetailLabel}>Priority</Text>
              </View>
              <View style={[styles.modalDetailPriorityBox, { backgroundColor: sevBg }]}>
                <Text style={[styles.modalDetailPriorityText, { color: sevColor }]}>
                  {report.severity.toUpperCase()} EMERGENCY RESPONSE
                </Text>
              </View>
            </View>

            {notes ? (
              <View style={styles.modalDetailRow}>
                <View style={styles.modalDetailLabelBox}>
                  <Text style={styles.modalDetailIcon}>📝</Text>
                  <Text style={styles.modalDetailLabel}>Notes</Text>
                </View>
                <Text style={styles.modalDetailValueText} numberOfLines={2}>{notes}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.modalInfoBox}>
            <Text style={styles.modalInfoIcon}>🌐</Text>
            <Text style={styles.modalInfoText}>
              Telemetry tracking will activate upon ranger acknowledgment.
            </Text>
          </View>

          <View style={styles.modalActionsExtended}>
            <TouchableOpacity style={styles.modalCancelBtnExtended} onPress={onClose} disabled={loading}>
              <Text style={styles.modalCancelTextExtended}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtnExtended, loading && { opacity: 0.8 }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalConfirmTextExtended}>DISPATCHING...</Text>
                </View>
              ) : (
                <Text style={styles.modalConfirmTextExtended}>► CONFIRM DISPATCH</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};


// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ConfirmAssignmentScreen: React.FC<ConfirmAssignmentScreenProps> = ({
  navigation,
  route,
}) => {
  const { reportId, rangerId, rangerName, report: passedReport } = route.params;

  const [report, setReport] = useState<ConflictReport | null>(passedReport ?? null);
  const [fetchLoading, setFetchLoading] = useState(!passedReport);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  useEffect(() => {
    if (passedReport) return;
    (async () => {
      try {
        const data = await conflictApi.getConflictReportById(reportId);
        setReport(data);
      } catch (err: any) {
        setFetchError(err.message || 'Unable to load report details.');
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [reportId, passedReport]);

  const handleDispatch = async () => {
    if (dispatching) return;
    setDispatching(true);
    setDispatchError(null);
    try {
      const officerName = authService.userName || 'Community Liaison Officer';
      await conflictApi.dispatchConflictReport(reportId, rangerId, notes, officerName);
      
      setShowConfirmModal(false);
      
      // Navigate to success screen
      navigation.navigate('DispatchSuccess', { reportId, rangerId });
    } catch (err: any) {
      setShowConfirmModal(false);
      setDispatchError(err.message || 'Unable to dispatch ranger. Please try again.');
    } finally {
      setDispatching(false);
    }
  };

  const handleChangeRanger = () => {
    navigation.navigate('AvailableRangerSelection', { reportId, report });
  };

  if (fetchLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Confirm Assignment</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.stateText}>Loading report details…</Text>
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
          <Text style={styles.topBarTitle}>Confirm Assignment</Text>
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

  const rangerInitials = rangerName ? rangerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RN';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerSubtitle}>WILDGUARD OPS - UC03</Text>
          <Text style={styles.headerTitle}>Confirm Assignment</Text>
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
            <View style={[styles.stepCircle, styles.stepCompleted]}>
              <Text style={styles.stepCheck}>✓</Text>
            </View>
            <View>
              <Text style={styles.stepTextActive}>Step 2</Text>
              <Text style={styles.stepTextActiveMain}>Select</Text>
            </View>
          </View>
          <View style={styles.stepLineActive} />

          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCurrent]}>
              <Text style={styles.stepCurrentNum}>3</Text>
            </View>
            <View>
              <Text style={styles.stepTextActive}>Step 3</Text>
              <Text style={styles.stepTextActiveMain}>Dispatch</Text>
            </View>
          </View>
        </View>

        {/* ── Report Summary Card ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>📄 INCIDENT REPORT {report.reportId}</Text>
            <View style={[styles.severityPill, { backgroundColor: sevBg }]}>
              <Text style={[styles.severityPillText, { color: sevColor }]}>■ {report.severity.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.reportTitle}>{report.conflictType}</Text>
          <Text style={styles.reportLocation}>📍 {report.locationName} ({report.park})</Text>

          <View style={styles.reportDescBox}>
            <Text style={styles.reportDescIcon}>⚠️</Text>
            <Text style={styles.reportDescText} numberOfLines={2}>{report.description}</Text>
          </View>
        </View>

        {/* ── Assigned Responder Card ──────────────────────────────────────── */}
        <View style={[styles.card, styles.responderCard]}>
          <View style={styles.responderTabs}>
            <View style={styles.tabActive}>
              <Text style={styles.tabActiveText}>✓ ASSIGNED RESPONDER</Text>
            </View>
            <View style={styles.tabInactive}>
              <Text style={styles.tabInactiveText}>AVAILABLE - READY TO ROLL</Text>
            </View>
          </View>

          <View style={styles.rangerInfoRow}>
            <View style={styles.rangerAvatar}>
              <Text style={styles.rangerInitials}>{rangerInitials}</Text>
            </View>
            <View style={styles.rangerDetails}>
              <Text style={styles.rangerIdText}>ID: {rangerId}  •  Field Specialist</Text>
              <Text style={styles.rangerNameText}>Ranger {rangerName}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🧭</Text>
              <View>
                <Text style={styles.statLabel}>Proximity</Text>
                <Text style={styles.statValue}>Not available</Text>
              </View>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⏱️</Text>
              <View>
                <Text style={styles.statLabel}>Est. Arrival</Text>
                <Text style={styles.statValue}>Not available</Text>
              </View>
            </View>
          </View>

          <View style={styles.equipmentBox}>
            <Text style={styles.equipmentLabel}>🧰 ASSIGNED EQUIPMENT</Text>
            <Text style={styles.equipmentText}>Not available</Text>
          </View>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerIcon}>ℹ️</Text>
            <Text style={styles.disclaimerText}>
              This ranger will be officially dispatched to respond to conflict report <Text style={styles.bold}>{report.reportId}</Text>. An emergency automated VHF alert and push notification will be broadcast to their rugged field handset.
            </Text>
          </View>
        </View>

        {/* ── Officer Tactical Notes ───────────────────────────────────────── */}
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesTitle}>📝 Officer Field Tactical Notes</Text>
            <Text style={styles.notesOptional}>Optional</Text>
          </View>
          
          <TextInput
            style={styles.notesInput}
            placeholder="E.g. Advised to approach from northern perimeter boundary."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
          <Text style={styles.notesFooter}>
            📡 Notes will append directly to Handset Mission Manifest.
          </Text>
        </View>

        {/* ── Dispatch Error ─────────────────────────────────────────── */}
        {dispatchError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.errorText}>{dispatchError}</Text>
              <TouchableOpacity onPress={() => setDispatchError(null)} style={styles.retryBtnSmall}>
                <Text style={styles.retryBtnTextSmall}>RETRY</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Bottom Actions ─────────────────────────────────────────────────── */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.changeRangerBtn}
          onPress={handleChangeRanger}
          disabled={dispatching}
        >
          <Text style={styles.changeRangerText}>⇄ CHANGE RANGER</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.dispatchBtn, dispatching && styles.dispatchBtnDisabled]}
          onPress={() => setShowConfirmModal(true)}
          disabled={dispatching || report.status !== 'Verified'}
        >
          {dispatching ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.dispatchBtnText}>DISPATCHING...</Text>
            </View>
          ) : (
            <Text style={styles.dispatchBtnText}>((•)) CONFIRM DISPATCH</Text>
          )}
        </TouchableOpacity>
      </View>

      <DispatchModal
        visible={showConfirmModal}
        reportId={report.reportId}
        rangerId={rangerId}
        rangerName={rangerName}
        report={report}
        notes={notes}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDispatch}
        loading={dispatching}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  bold: { fontWeight: 'bold' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  headerBackBtn: {
    paddingRight: 16,
  },
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

  // Scroll
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },

  // Step Indicator
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
  stepCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  stepCurrentNum: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  stepTextActive: { fontSize: 9, color: '#1B4332', fontWeight: '700' },
  stepTextActiveMain: { fontSize: 11, color: '#1B4332', fontWeight: '800' },
  stepLineActive: { flex: 1, height: 2, backgroundColor: '#10B981', marginHorizontal: 8 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  severityPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  severityPillText: { fontSize: 9, fontWeight: '800' },
  reportTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 },
  reportLocation: { fontSize: 13, color: '#4B5563', fontWeight: '500', marginBottom: 12 },
  reportDescBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8, padding: 10,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  reportDescIcon: { fontSize: 14, marginRight: 8 },
  reportDescText: { fontSize: 12, color: '#4B5563', flex: 1, lineHeight: 18 },

  // Responder Card
  responderCard: {
    borderColor: '#1B4332',
    borderWidth: 1.5,
  },
  responderTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabActive: { backgroundColor: '#D1FAE5', paddingVertical: 6, paddingHorizontal: 12, flex: 1, alignItems: 'center' },
  tabActiveText: { color: '#065F46', fontSize: 10, fontWeight: '800' },
  tabInactive: { paddingVertical: 6, paddingHorizontal: 12, flex: 1, alignItems: 'center' },
  tabInactiveText: { color: '#6B7280', fontSize: 10, fontWeight: '700' },

  rangerInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rangerAvatar: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#A7F3D0',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  rangerInitials: { fontSize: 18, fontWeight: '800', color: '#065F46' },
  rangerDetails: { flex: 1 },
  rangerIdText: { fontSize: 11, color: '#047857', fontWeight: '700', marginBottom: 2 },
  rangerNameText: { fontSize: 16, fontWeight: '800', color: '#111827' },

  statsRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  statBox: {
    flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6',
  },
  statIcon: { fontSize: 16, marginRight: 10 },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  statValue: { fontSize: 12, color: '#111827', fontWeight: '800' },

  equipmentBox: { marginBottom: 16 },
  equipmentLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', marginBottom: 4 },
  equipmentText: { fontSize: 13, color: '#111827', fontWeight: '600' },

  disclaimerBox: {
    backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  disclaimerIcon: { fontSize: 16, marginRight: 10 },
  disclaimerText: { fontSize: 11, color: '#4B5563', lineHeight: 16, flex: 1 },

  // Notes
  notesSection: { marginBottom: 16 },
  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  notesTitle: { fontSize: 12, fontWeight: '700', color: '#374151' },
  notesOptional: { fontSize: 11, color: '#6B7280' },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 12,
    fontSize: 13, color: '#111827',
    minHeight: 80, marginBottom: 8,
  },
  notesFooter: { fontSize: 10, color: '#6B7280' },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    gap: 12,
  },
  changeRangerBtn: {
    flex: 1,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  changeRangerText: { fontSize: 12, fontWeight: '800', color: '#374151' },
  dispatchBtn: {
    flex: 1.5,
    backgroundColor: '#1B4332',
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  dispatchBtnDisabled: { backgroundColor: '#4B5563' },
  dispatchBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

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
  
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 12 },
  modalMessage: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  modalConfirmBtn: {
    flex: 1.2, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  confirmGreen: { backgroundColor: '#1B4332' },
  modalConfirmText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#FECACA', marginBottom: 16,
  },
  errorIcon: { fontSize: 16, marginRight: 8, marginTop: 2 },
  errorText: { fontSize: 13, color: '#B91C1C', fontWeight: '600', marginBottom: 8 },
  retryBtnSmall: { alignSelf: 'flex-start', backgroundColor: '#B91C1C', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  retryBtnTextSmall: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  // Extended Modal Styles
  modalCardExtended: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    paddingTop: 30, // space for the shield
  },
  modalShieldBox: {
    position: 'absolute',
    top: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4EA',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  modalShieldIcon: { fontSize: 24 },
  modalTitleLarge: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 12, textAlign: 'center' },
  modalMessageExtended: { fontSize: 13, color: '#4B5563', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalDetailCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    width: '100%',
    padding: 16,
    marginBottom: 16,
  },
  modalDetailHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalDetailFileIcon: { fontSize: 18, marginRight: 8 },
  modalDetailDestLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280', marginRight: 8 },
  modalDetailDestValue: { fontSize: 12, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'right' },
  modalDetailDivider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 },
  modalDetailRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  modalDetailLabelBox: { flexDirection: 'row', alignItems: 'center', width: '40%' },
  modalDetailIcon: { fontSize: 14, marginRight: 6 },
  modalDetailLabel: { fontSize: 11, fontWeight: '600', color: '#4B5563' },
  modalDetailValueGreen: { fontSize: 11, fontWeight: '800', color: '#047857', flex: 1, textAlign: 'right' },
  modalDetailPriorityBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  modalDetailPriorityText: { fontSize: 10, fontWeight: '800' },
  modalDetailValueText: { fontSize: 11, color: '#374151', flex: 1, textAlign: 'right', fontStyle: 'italic' },
  modalInfoBox: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  modalInfoIcon: { fontSize: 16, marginRight: 10 },
  modalInfoText: { fontSize: 11, color: '#1E3A8A', flex: 1, fontWeight: '500' },
  modalActionsExtended: { flexDirection: 'row', width: '100%', gap: 12 },
  modalCancelBtnExtended: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelTextExtended: { color: '#4B5563', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  modalConfirmBtnExtended: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1B4332',
    alignItems: 'center',
  },
  modalConfirmTextExtended: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
});

export default ConfirmAssignmentScreen;

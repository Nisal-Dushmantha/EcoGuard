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
import { authService } from '../services/authService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerifyConfirmScreenProps {
  navigation: any;
  route: { params: { reportId: string; report?: ConflictReport } };
}

// ─── Severity helpers ────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#DC2626', High: '#EF4444', Medium: '#F59E0B', Low: '#10B981',
};
const SEVERITY_BG: Record<string, string> = {
  Critical: '#FEE2E2', High: '#FFF0F0', Medium: '#FEF3C7', Low: '#D1FAE5',
};

// ─── Checklist Item ──────────────────────────────────────────────────────────

const ChecklistItem = ({ text }: { text: string }) => (
  <View style={styles.checklistItem}>
    <View style={styles.checkCircle}>
      <Text style={styles.checkMark}>✓</Text>
    </View>
    <Text style={styles.checkText}>{text}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const VerifyConfirmScreen: React.FC<VerifyConfirmScreenProps> = ({
  navigation,
  route,
}) => {
  const { reportId, report: passedReport } = route.params;

  // Use the report passed from the Details screen if available,
  // otherwise fetch it (covers direct deep-link navigation)
  const [report, setReport] = useState<ConflictReport | null>(passedReport ?? null);
  const [fetchLoading, setFetchLoading] = useState(!passedReport);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Action state
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Load report if not passed
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

  // ── Verify handler ───────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (verifying) return; // Prevent double-tap
    setVerifying(true);
    setVerifyError(null);
    try {
      // Get the CLO name from authService (populated on login)
      const officerName = authService.userName || 'Community Liaison Officer';
      await conflictApi.verifyConflictReport(reportId, officerName);
      // Navigate forward ONLY after backend confirms success
      navigation.navigate('AvailableRangerSelection', { reportId });
    } catch (err: any) {
      setVerifyError(err.message || 'Unable to verify this report. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // ── Loading / Error states ───────────────────────────────────────────────────

  if (fetchLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Verify Report</Text>
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
          <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Verify Report</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.stateBox}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>{fetchError || 'Report not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleCancel}>
            <Text style={styles.retryBtnText}>← GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sevColor = SEVERITY_COLOR[report.severity] ?? '#6B7280';
  const sevBg = SEVERITY_BG[report.severity] ?? '#F9FAFB';

  // ── Main UI ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Verify Report</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Shield Icon ──────────────────────────────────────────── */}
        <View style={styles.shieldWrapper}>
          <View style={styles.shieldOuter}>
            <View style={styles.shieldInner}>
              <Text style={styles.shieldIcon}>🛡️</Text>
            </View>
          </View>
        </View>

        {/* ── Title ───────────────────────────────────────────────── */}
        <Text style={styles.title}>Verify this conflict report?</Text>

        {/* ── Report Summary Card ──────────────────────────────────── */}
        <View style={styles.summaryCard}>
          {/* Report ID row */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}># REPORT ID</Text>
            <Text style={styles.summaryReportId}>{report.reportId}</Text>
          </View>

          <View style={styles.summaryDivider} />

          {/* Location & Threat */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Location & Threat</Text>
            <View style={styles.summaryValueGroup}>
              <Text style={styles.summaryValueMain} numberOfLines={1}>
                {report.locationName}
              </Text>
              <View style={[styles.severityPill, { backgroundColor: sevBg }]}>
                <Text style={[styles.severityPillText, { color: sevColor }]}>
                  ▲ {report.severity} Severity
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          {/* Incident classification */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Incident Classification</Text>
            <View style={styles.summaryValueGroup}>
              <Text style={styles.summaryValueBold}>
                {report.animalSpecies}
              </Text>
              <Text style={styles.summaryValueSub}>
                {report.conflictType}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Description Text ─────────────────────────────────────── */}
        <Text style={styles.descriptionText}>
          Once verified, this conflict incident will be logged as an official active case, and you
          will proceed immediately to assign and dispatch a ranger team.
        </Text>

        {/* ── Checklist ────────────────────────────────────────────── */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>OPERATIONAL VERIFICATION CHECKLIST</Text>
          <ChecklistItem text="Location verified within park buffer zone" />
          <ChecklistItem text="Liaison credibility confirmed" />
          <ChecklistItem text={`Species identified: ${report.animalSpecies}`} />
          <ChecklistItem text={`Severity assessed: ${report.severity}`} />
        </View>

        {/* ── Verify Error ─────────────────────────────────────────── */}
        {verifyError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.errorText}>{verifyError}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Primary Action Button ─────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.verifyBtn, verifying && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={verifying}
          activeOpacity={0.85}
        >
          {verifying ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.verifyBtnText}>VERIFYING…</Text>
            </>
          ) : (
            <>
              <Text style={styles.verifyBtnText}>VERIFY & PROCEED TO RANGER ASSIGNMENT</Text>
              <Text style={styles.verifyBtnArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Cancel ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          disabled={verifying}
        >
          <Text style={[styles.cancelText, verifying && { opacity: 0.4 }]}>CANCEL</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: '#374151', fontWeight: '700' },
  topBarTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 14, fontWeight: '700', color: '#374151',
  },

  // States
  stateBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  stateEmoji: { fontSize: 40, marginBottom: 16 },
  stateTitle: {
    fontSize: 15, fontWeight: '700', color: '#374151',
    textAlign: 'center', marginBottom: 20,
  },
  stateText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  retryBtn: {
    backgroundColor: '#1B4332', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 10,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // Scroll
  scroll: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },

  // Shield
  shieldWrapper: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  shieldOuter: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
  },
  shieldInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#A7F3D0',
    alignItems: 'center', justifyContent: 'center',
  },
  shieldIcon: { fontSize: 32 },

  // Title
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 30,
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
    paddingTop: 2,
  },
  summaryReportId: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1B4332',
    letterSpacing: 0.5,
  },
  summaryValueGroup: { alignItems: 'flex-end', flex: 1.5 },
  summaryValueMain: {
    fontSize: 13, fontWeight: '700', color: '#111827',
    textAlign: 'right', marginBottom: 4,
  },
  summaryValueBold: {
    fontSize: 13, fontWeight: '800', color: '#111827', textAlign: 'right',
  },
  summaryValueSub: {
    fontSize: 11, color: '#6B7280', textAlign: 'right', marginTop: 2,
  },
  severityPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12,
  },
  severityPillText: { fontSize: 10, fontWeight: '800' },

  // Description
  descriptionText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },

  // Checklist
  checklistSection: { marginBottom: 24 },
  checklistTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#1B4332',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  checkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  checkText: { fontSize: 13, color: '#374151', fontWeight: '600', flex: 1 },

  // Error box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  errorText: { fontSize: 13, color: '#B91C1C', fontWeight: '600', flex: 1, lineHeight: 18 },

  // Verify button
  verifyBtn: {
    backgroundColor: '#1B4332',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyBtnDisabled: {
    backgroundColor: '#4B5563',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  verifyBtnArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
  },

  // Cancel
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
});

export default VerifyConfirmScreen;

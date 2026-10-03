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
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conflictApi, ConflictReport } from '../services/conflictApi';
import { authService } from '../services/authService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConflictReportDetailsProps {
  navigation: any;
  route: { params: { reportId: string } };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#DC2626', High: '#EF4444', Medium: '#F59E0B', Low: '#10B981',
};
const SEVERITY_BG: Record<string, string> = {
  Critical: '#FEE2E2', High: '#FEF2F2', Medium: '#FEF3C7', Low: '#D1FAE5',
};
const ANIMAL_ICON: Record<string, string> = {
  'Asian Elephant': '🐘', 'Sri Lankan Leopard': '🐆', 'Wild Boar': '🐗',
  'Sloth Bear': '🐻', 'Mugger Crocodile': '🐊', Other: '⚠️',
};

function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'Not provided';
  const d = new Date(dateStr as string);
  if (isNaN(d.getTime())) return 'Not provided';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
  </View>
);

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.sectionCard}>{children}</View>
);

// ─── Verify Modal ─────────────────────────────────────────────────────────────

const VerifyModal = ({
  visible,
  reportId,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  reportId: string;
  onClose: () => void;
  onSuccess: (updated: ConflictReport) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await conflictApi.verifyConflictReport(reportId);
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconBox}>
            <Text style={styles.modalIcon}>✅</Text>
          </View>
          <Text style={styles.modalTitle}>Verify this conflict report?</Text>
          <Text style={styles.modalMessage}>
            Once verified, this report can proceed to ranger assignment and field dispatch.
          </Text>
          {error ? (
            <View style={styles.modalErrorBox}>
              <Text style={styles.modalErrorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, styles.confirmGreen]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalConfirmText}>✓  Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────

const RejectModal = ({
  visible,
  reportId,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  reportId: string;
  onClose: () => void;
  onSuccess: (updated: ConflictReport) => void;
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await conflictApi.rejectConflictReport(reportId, reason.trim());
      setReason('');
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Rejection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconBox, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.modalIcon}>🚫</Text>
          </View>
          <Text style={styles.modalTitle}>Reject this report?</Text>
          <Text style={styles.modalMessage}>
            This report will be marked as rejected and removed from the pending queue.
          </Text>

          <Text style={styles.reasonLabel}>Reason for rejection *</Text>
          <TextInput
            style={[styles.reasonInput, error && reason.trim() === '' && styles.reasonInputError]}
            placeholder="e.g. Insufficient evidence, duplicate report, false alarm..."
            placeholderTextColor="#9CA3AF"
            value={reason}
            onChangeText={(t) => { setReason(t); setError(null); }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {error ? (
            <View style={styles.modalErrorBox}>
              <Text style={styles.modalErrorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, styles.confirmRed]}
              onPress={handleReject}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalConfirmText}>Reject Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { bg: string; text: string; color: string }> = {
    'Pending Verification': { bg: '#FEF3C7', text: 'PENDING', color: '#B45309' },
    Verified: { bg: '#D1FAE5', text: 'VERIFIED', color: '#065F46' },
    Rejected: { bg: '#FEE2E2', text: 'REJECTED', color: '#B91C1C' },
    Dispatched: { bg: '#DBEAFE', text: 'DISPATCHED', color: '#1D4ED8' },
    Resolved: { bg: '#F3F4F6', text: 'RESOLVED', color: '#374151' },
    'False Alarm': { bg: '#F3F4F6', text: 'FALSE ALARM', color: '#6B7280' },
  };
  const cfg = statusConfig[status] ?? { bg: '#F3F4F6', text: status.toUpperCase(), color: '#374151' };
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.text}</Text>
    </View>
  );
};

// ─── GPS Map Block ────────────────────────────────────────────────────────────

const MapBlock = ({ report }: { report: ConflictReport }) => {
  const hasCoords = report.coordinates?.latitude && report.coordinates?.longitude;
  const lat = report.coordinates?.latitude.toFixed(4);
  const lng = report.coordinates?.longitude.toFixed(4);

  const openMaps = () => {
    if (!hasCoords) return;
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open maps.'));
  };

  return (
    <View style={styles.mapBlock}>
      <View style={styles.mapHeader}>
        <Text style={styles.mapHeaderIcon}>🗺</Text>
        <Text style={styles.mapHeaderText}>TACTICAL FIELD TOPOGRAPHY</Text>
        {hasCoords && (
          <Text style={styles.mapCoordPill}>{lat}° N, {lng}° E</Text>
        )}
      </View>

      {hasCoords ? (
        <TouchableOpacity style={styles.mapPlaceholder} onPress={openMaps} activeOpacity={0.8}>
          <View style={styles.mapContent}>
            {/* Grid lines decorative */}
            <View style={styles.mapGrid}>
              {[...Array(5)].map((_, i) => (
                <View key={`h-${i}`} style={[styles.mapGridLineH, { top: `${i * 25}%` as any }]} />
              ))}
              {[...Array(5)].map((_, i) => (
                <View key={`v-${i}`} style={[styles.mapGridLineV, { left: `${i * 25}%` as any }]} />
              ))}
            </View>
            {/* Center marker */}
            <View style={styles.mapMarkerContainer}>
              <View style={styles.mapMarkerOuter}>
                <View style={styles.mapMarkerInner} />
              </View>
              <Text style={styles.mapMarkerLabel}>
                {ANIMAL_ICON[report.animalSpecies] ?? '⚠️'} SIGHTING
              </Text>
            </View>
            {/* Location label */}
            <View style={styles.mapLocationLabel}>
              <Text style={styles.mapLocationText}>{report.locationName.toUpperCase()} PERIMETER</Text>
            </View>
          </View>
          <View style={styles.mapFooter}>
            <Text style={styles.mapFooterText}>
              📍 {lat}° N, {lng}° E  •  Tap to open in Maps
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.mapUnavailable}>
          <Text style={styles.mapUnavailableIcon}>📍</Text>
          <Text style={styles.mapUnavailableText}>Location coordinates unavailable</Text>
          <Text style={styles.mapUnavailableSubtext}>GPS data was not captured for this report</Text>
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ConflictReportDetailsScreen: React.FC<ConflictReportDetailsProps> = ({
  navigation,
  route,
}) => {
  const { reportId } = route.params;
  const [report, setReport] = useState<ConflictReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setError(null);
      const data = await conflictApi.getConflictReportById(reportId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load conflict report.');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleRejectSuccess = (updated: ConflictReport) => {
    setReport(updated);
    setShowRejectModal(false);
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Report Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.stateTitle}>Loading report details…</Text>
          <Text style={styles.stateSubtitle}>Fetching from EcoGuard database</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Report Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.stateBox}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>{error || 'Report not found'}</Text>
          <Text style={styles.stateSubtitle}>
            The report ID "{reportId}" could not be loaded.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setLoading(true); fetchReport(); }}
          >
            <Text style={styles.retryBtnText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sevColor = SEVERITY_COLOR[report.severity] ?? '#6B7280';
  const sevBg = SEVERITY_BG[report.severity] ?? '#F3F4F6';
  const isPending = report.status === 'Pending Verification';
  const isVerified = report.status === 'Verified';
  const isRejected = report.status === 'Rejected';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Report Details</Text>
        </View>
        <View style={styles.topBarRight}>
          <View style={[styles.topBarSevBadge, { backgroundColor: sevBg }]}>
            <Text style={[styles.topBarSevText, { color: sevColor }]}>
              {report.severity === 'Critical' ? '🔴' : report.severity === 'High' ? '🔺' : report.severity === 'Medium' ? '🟡' : '🟢'} {report.severity.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── ID / Time Strip ─────────────────────────────────────── */}
        <View style={styles.idStrip}>
          <Text style={styles.idText}>{report.reportId}</Text>
          <View style={styles.idRight}>
            <Text style={styles.idTime}>🕐 {formatDate(report.reportedAt)}</Text>
            <Text style={styles.idTimeAgo}> ({formatTimeAgo(report.reportedAt)})</Text>
          </View>
        </View>

        {/* ── Hero Banner ──────────────────────────────────────────── */}
        <View style={[styles.heroBanner, { borderColor: sevColor, backgroundColor: sevBg }]}>
          <View style={styles.heroLeft}>
            <StatusBadge status={report.status} />
            {isPending && (
              <View style={styles.threatBadge}>
                <Text style={styles.threatText}>
                  Threat Radius  Zone {report.park?.split(' ')[0] ?? '?'} Active Buffer
                </Text>
              </View>
            )}
            <Text style={[styles.heroTitle, { color: sevColor }]}>{report.conflictType}</Text>
          </View>
        </View>

        {/* ── Animal Type + Incident Mode ──────────────────────────── */}
        <View style={styles.twoColGrid}>
          <SectionCard>
            <View style={styles.miniCardInner}>
              <Text style={styles.miniCardLabel}>🐾 ANIMAL TYPE</Text>
              <Text style={styles.miniCardEmoji}>{ANIMAL_ICON[report.animalSpecies] ?? '⚠️'}</Text>
              <Text style={styles.miniCardValue}>{report.animalSpecies || 'Unknown'}</Text>
              <Text style={styles.miniCardSub}>detected</Text>
            </View>
          </SectionCard>
          <SectionCard>
            <View style={styles.miniCardInner}>
              <Text style={styles.miniCardLabel}>⚡ INCIDENT MODE</Text>
              <Text style={styles.miniCardEmoji}>🌾</Text>
              <Text style={styles.miniCardValue}>{report.conflictType}</Text>
              <Text style={styles.miniCardSub}>Settlement proximity</Text>
            </View>
          </SectionCard>
        </View>

        {/* ── Target Zone / Location ───────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📍 TARGET ZONE</Text>
          <SectionCard>
            <View style={styles.targetZoneRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.targetZoneValue}>{report.locationName || 'Not provided'}</Text>
                <Text style={styles.targetZonePark}>{report.park || 'Not provided'}</Text>
              </View>
              {report.coordinates && (
                <View style={styles.coordBox}>
                  <Text style={styles.coordText}>Lat: {report.coordinates.latitude.toFixed(4)}°</Text>
                  <Text style={styles.coordText}>Long: {report.coordinates.longitude.toFixed(4)}° E</Text>
                </View>
              )}
            </View>
          </SectionCard>
        </View>

        {/* ── Field Observation Log ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📋 FIELD OBSERVATION LOG</Text>
          <SectionCard>
            <View style={styles.observationBox}>
              <Text style={styles.quoteChar}>"</Text>
              <Text style={styles.observationText}>
                {report.description || 'No field observation recorded for this report.'}
              </Text>
              <Text style={[styles.quoteChar, styles.quoteEnd]}>"</Text>
            </View>
            {report.actionTaken ? (
              <View style={styles.actionTakenBox}>
                <Text style={styles.actionTakenLabel}>ACTION TAKEN</Text>
                <Text style={styles.actionTakenValue}>{report.actionTaken}</Text>
              </View>
            ) : null}
            {report.rejectionReason ? (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionLabel}>REJECTION REASON</Text>
                <Text style={styles.rejectionValue}>{report.rejectionReason}</Text>
              </View>
            ) : null}
          </SectionCard>
        </View>

        {/* ── Reporter Information ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>👤 REPORTER INFORMATION</Text>
          <SectionCard>
            <View style={styles.reporterRow}>
              {/* Avatar */}
              <View style={styles.reporterAvatar}>
                <Text style={styles.reporterInitials}>
                  {report.reporterName
                    ? report.reporterName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                    : '??'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reporterName}>{report.reporterName || 'Unknown reporter'}</Text>
                <Text style={styles.reporterContact}>
                  {report.contactNumber || 'No contact number'}
                </Text>
              </View>
              {report.contactNumber ? (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${report.contactNumber}`)}
                >
                  <Text style={styles.callBtnIcon}>📞</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </SectionCard>
        </View>

        {/* ── Report Meta ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📊 REPORT METADATA</Text>
          <SectionCard>
            <DetailRow label="Report ID" value={report.reportId} />
            <DetailRow label="Severity" value={report.severity} />
            <DetailRow label="Status" value={report.status} />
            <DetailRow label="Reported At" value={formatDate(report.reportedAt)} />
            <DetailRow label="Created At" value={formatDate(report.createdAt)} />
          </SectionCard>
        </View>

        {/* ── Photo Evidence Card if available ─────────────────────── */}
        {report.photoUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📷 PHOTOGRAPHIC EVIDENCE</Text>
            <SectionCard>
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: report.photoUrl }}
                  style={styles.evidenceImage}
                  resizeMode="cover"
                />
              </View>
            </SectionCard>
          </View>
        ) : null}

        {/* ── Lifecycle Timeline ───────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🔄 REPORT LIFECYCLE TIMELINE</Text>
          <SectionCard>
            <View style={styles.timelineContainer}>
              {[
                { key: 'Submitted', label: 'SUBMITTED', time: report.reportedAt, active: true },
                { key: 'Pending Verification', label: 'PENDING REVIEW', time: report.reportedAt, active: true },
                { key: 'Verified', label: 'VERIFIED', time: report.verifiedAt, active: ['Verified', 'Dispatched', 'In Progress', 'Resolved'].includes(report.status) },
                { key: 'Ranger Assigned', label: 'RANGER ASSIGNED', time: report.dispatchedAt, active: ['Dispatched', 'In Progress', 'Resolved'].includes(report.status) },
                { key: 'Dispatched', label: 'DISPATCHED', time: report.dispatchedAt, active: ['Dispatched', 'In Progress', 'Resolved'].includes(report.status) },
                { key: 'In Progress', label: 'IN PROGRESS', time: report.inProgressAt, active: ['In Progress', 'Resolved'].includes(report.status) },
                { key: 'Resolved', label: 'RESOLVED', time: report.resolvedAt, active: report.status === 'Resolved' },
              ].map((step, idx, arr) => (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.timelineColLeft}>
                    <View style={[styles.timelineNode, step.active ? styles.nodeActive : styles.nodeInactive]}>
                      {step.active ? <Text style={styles.nodeCheck}>✓</Text> : null}
                    </View>
                    {idx < arr.length - 1 && (
                      <View style={[styles.timelineLine, step.active && arr[idx + 1].active ? styles.lineActive : styles.lineInactive]} />
                    )}
                  </View>
                  <View style={styles.timelineColRight}>
                    <Text style={[styles.timelineStepLabel, step.active ? styles.stepActiveText : styles.stepInactiveText]}>
                      {step.label}
                    </Text>
                    {step.active && step.time ? (
                      <Text style={styles.timelineTimestamp}>{formatDate(step.time)}</Text>
                    ) : (
                      <Text style={styles.timelinePendingText}>Awaiting action</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>
        </View>

        {/* ── Tactical Field Topography (Map) ─────────────────────── */}
        <MapBlock report={report} />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Action Buttons (Role Restricted) ───────────────── */}
      <View style={styles.bottomActions}>
        {(authService.userRole === 'Community Member' || authService.userRole === 'COMMUNITY_MEMBER') ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.verifyBtn, { flex: 1 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.verifyBtnText}>← BACK TO MY REPORTS</Text>
          </TouchableOpacity>
        ) : (
          <>
            {isPending && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => setShowRejectModal(true)}
                >
                  <Text style={styles.rejectBtnText}>✕  REJECT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.verifyBtn]}
                  onPress={() => navigation.navigate('VerifyConfirm', { reportId: report.reportId, report })}
                >
                  <Text style={styles.verifyBtnText}>✓  VERIFY REPORT</Text>
                </TouchableOpacity>
              </>
            )}

            {isVerified && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.verifyBtn, { flex: 1 }]}
                onPress={() => navigation.navigate('AvailableRangerSelection', { reportId: report.reportId })}
              >
                <Text style={styles.verifyBtnText}>🧭  FIND AVAILABLE RANGER</Text>
              </TouchableOpacity>
            )}

            {isRejected && (
              <View style={[styles.actionBtn, styles.rejectedBanner, { flex: 1 }]}>
                <Text style={styles.rejectedBannerText}>🚫  This report has been rejected</Text>
              </View>
            )}

            {!isPending && !isVerified && !isRejected && (
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#374151' }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.verifyBtnText}>← BACK TO REPORTS</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <RejectModal
        visible={showRejectModal}
        reportId={report.reportId}
        onClose={() => setShowRejectModal(false)}
        onSuccess={handleRejectSuccess}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

  // Top bar
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: '#374151', fontWeight: '700' },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  topBarRight: { flexDirection: 'row', alignItems: 'center' },
  topBarSevBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6,
  },
  topBarSevText: { fontSize: 10, fontWeight: '800' },

  // State screens
  stateBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  stateEmoji: { fontSize: 40, marginBottom: 16 },
  stateTitle: {
    fontSize: 16, fontWeight: '700', color: '#374151',
    textAlign: 'center', marginTop: 12, marginBottom: 6,
  },
  stateSubtitle: {
    fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18, marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#1B4332', paddingHorizontal: 28,
    paddingVertical: 12, borderRadius: 10,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  // Scroll
  scroll: { paddingBottom: 24 },

  // ID strip
  idStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  idText: { fontSize: 13, fontWeight: '900', color: '#1B4332', letterSpacing: 0.5 },
  idRight: { flexDirection: 'row', alignItems: 'center' },
  idTime: { fontSize: 11, color: '#4B5563', fontWeight: '600' },
  idTimeAgo: { fontSize: 11, color: '#9CA3AF' },

  // Hero banner
  heroBanner: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  heroLeft: { flex: 1 },
  heroTitle: { fontSize: 22, fontWeight: '900', marginTop: 10 },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  threatBadge: {
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  threatText: { fontSize: 10, color: '#374151', fontWeight: '600' },

  // Two column grid
  twoColGrid: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 10,
  },
  miniCardInner: { alignItems: 'flex-start', padding: 4 },
  miniCardLabel: { fontSize: 9, fontWeight: '800', color: '#6B7280', letterSpacing: 0.8, marginBottom: 6 },
  miniCardEmoji: { fontSize: 28, marginBottom: 4 },
  miniCardValue: { fontSize: 13, fontWeight: '800', color: '#111827' },
  miniCardSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  // Section
  section: { paddingHorizontal: 14, marginBottom: 12 },
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: '#6B7280',
    letterSpacing: 0.8, marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  // Target zone
  targetZoneRow: { flexDirection: 'row', alignItems: 'flex-start' },
  targetZoneValue: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  targetZonePark: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  coordBox: { marginLeft: 12 },
  coordText: { fontSize: 11, color: '#1B4332', fontWeight: '700', fontFamily: 'monospace' },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', flex: 1 },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 2, textAlign: 'right' },

  // Observation
  observationBox: {
    backgroundColor: '#F8FFF9',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    marginBottom: 4,
  },
  quoteChar: { fontSize: 24, color: '#10B981', fontWeight: '900', lineHeight: 20 },
  quoteEnd: { textAlign: 'right' },
  observationText: {
    fontSize: 14, color: '#374151', lineHeight: 22,
    fontStyle: 'italic', marginHorizontal: 4,
  },
  actionTakenBox: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  actionTakenLabel: { fontSize: 9, fontWeight: '800', color: '#047857', letterSpacing: 0.8, marginBottom: 4 },
  actionTakenValue: { fontSize: 13, color: '#065F46', fontWeight: '600' },
  rejectionBox: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    backgroundColor: '#FEF2F2',
    borderRadius: 8, padding: 10,
  },
  rejectionLabel: { fontSize: 9, fontWeight: '800', color: '#B91C1C', letterSpacing: 0.8, marginBottom: 4 },
  rejectionValue: { fontSize: 13, color: '#991B1B', fontWeight: '600' },

  // Reporter
  reporterRow: { flexDirection: 'row', alignItems: 'center' },
  reporterAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1B4332',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  reporterInitials: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  reporterName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  reporterContact: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1B4332',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },
  callBtnIcon: { fontSize: 18 },

  // Map
  mapBlock: { paddingHorizontal: 14, marginBottom: 12 },
  mapHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8,
  },
  mapHeaderIcon: { fontSize: 14, marginRight: 6 },
  mapHeaderText: {
    fontSize: 10, fontWeight: '800', color: '#6B7280',
    letterSpacing: 0.8, flex: 1,
  },
  mapCoordPill: {
    fontSize: 10, fontFamily: 'monospace',
    color: '#1B4332', fontWeight: '700',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  mapPlaceholder: {
    backgroundColor: '#0D1F1A',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1B4332',
  },
  mapContent: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mapGridLineH: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(82,183,136,0.15)',
  },
  mapGridLineV: {
    position: 'absolute', top: 0, bottom: 0, width: 1,
    backgroundColor: 'rgba(82,183,136,0.15)',
  },
  mapMarkerContainer: { alignItems: 'center' },
  mapMarkerOuter: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#EF4444',
  },
  mapMarkerInner: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#EF4444',
  },
  mapMarkerLabel: {
    color: '#FFFFFF', fontSize: 11, fontWeight: '700',
    marginTop: 6, letterSpacing: 0.5,
  },
  mapLocationLabel: {
    position: 'absolute', bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6,
  },
  mapLocationText: { color: '#52B788', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  mapFooter: {
    backgroundColor: '#0A1810',
    paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#1B4332',
  },
  mapFooterText: { color: '#52B788', fontSize: 10, fontWeight: '600' },
  mapUnavailable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  mapUnavailableIcon: { fontSize: 32, marginBottom: 8 },
  mapUnavailableText: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 4 },
  mapUnavailableSubtext: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },

  // Bottom actions
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    flex: 0.7,
  },
  rejectBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  verifyBtn: { backgroundColor: '#1B4332' },
  verifyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  rejectedBanner: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' },
  rejectedBannerText: { color: '#B91C1C', fontWeight: '700', fontSize: 13 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalIcon: { fontSize: 26 },
  modalTitle: {
    fontSize: 18, fontWeight: '800', color: '#111827',
    textAlign: 'center', marginBottom: 8,
  },
  modalMessage: {
    fontSize: 13, color: '#6B7280', textAlign: 'center',
    lineHeight: 20, marginBottom: 20,
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2', borderRadius: 8,
    padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  modalErrorText: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, color: '#374151', fontWeight: '700' },
  modalConfirmBtn: {
    flex: 1.4, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  confirmGreen: { backgroundColor: '#1B4332' },
  confirmRed: { backgroundColor: '#B91C1C' },
  modalConfirmText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },

  // Reject reason input
  reasonLabel: {
    fontSize: 13, fontWeight: '700', color: '#374151',
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12, fontSize: 13, color: '#111827',
    minHeight: 90, marginBottom: 12,
  },
  reasonInputError: { borderColor: '#EF4444' },

  // Photo evidence
  photoContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  evidenceImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },

  // Lifecycle Timeline
  timelineContainer: {
    paddingVertical: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  timelineColLeft: {
    width: 24,
    alignItems: 'center',
  },
  timelineNode: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActive: {
    backgroundColor: '#10B981',
  },
  nodeInactive: {
    backgroundColor: '#E5E7EB',
  },
  nodeCheck: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  timelineLine: {
    width: 2,
    height: 24,
    marginTop: 2,
  },
  lineActive: {
    backgroundColor: '#10B981',
  },
  lineInactive: {
    backgroundColor: '#E5E7EB',
  },
  timelineColRight: {
    flex: 1,
    marginLeft: 10,
  },
  timelineStepLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepActiveText: {
    color: '#111827',
  },
  stepInactiveText: {
    color: '#9CA3AF',
  },
  timelineTimestamp: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    marginTop: 2,
  },
  timelinePendingText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default ConflictReportDetailsScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { THEME } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { StatusBadge } from '../components/StatusBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { INCIDENT_TYPE_METADATA } from '../constants/incidentTypes';
import { SYNC_STATUS } from '../constants/syncStatus';
import { LocalIncidentRecord } from '../types/incident';
import { formatCoordinates, formatDateTime } from '../utils/helpers';
import { IncidentStorageService } from '../services/incidentStorage';
import { useIncidentSync } from '../hooks/useIncidentSync';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface IncidentDetailsScreenProps {
  route: {
    params: {
      incidentId: string;
      incident?: LocalIncidentRecord;
    };
  };
  navigation: any;
}

export const IncidentDetailsScreen: React.FC<IncidentDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { incidentId, incident: initialIncident } = route.params;
  const { isConnected } = useNetworkStatus();
  const { retryIncident } = useIncidentSync();

  const [incident, setIncident] = useState<LocalIncidentRecord | null>(initialIncident || null);
  const [loading, setLoading] = useState<boolean>(!initialIncident);
  const [retrying, setRetrying] = useState<boolean>(false);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const item = await IncidentStorageService.getLocalIncident(incidentId);
        if (item) {
          setIncident(item);
        }
      } catch (err) {
        console.error('Failed to load incident details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!incident) {
      fetchIncident();
    }
  }, [incidentId, incident]);

  const handleRetrySync = async () => {
    if (!incident) return;
    if (!isConnected) {
      Alert.alert('Offline', 'Connect to the internet to retry synchronization.');
      return;
    }

    setRetrying(true);
    try {
      const updated = await retryIncident(incident.localId);
      if (updated) {
        setIncident(updated);
        Alert.alert('Success', 'Incident synchronized successfully with central server.');
      }
    } catch (err: any) {
      Alert.alert('Retry Failed', err.message || 'Unable to synchronize incident.');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Incident Details" onBack={() => navigation.goBack()} />
        <View style={styles.centerBox}>
          <ActivityIndicator color={THEME.colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading report details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!incident) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Incident Details" onBack={() => navigation.goBack()} />
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorTitle}>Incident Not Found</Text>
          <Text style={styles.errorSub}>The requested report could not be found in local storage.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const meta = INCIDENT_TYPE_METADATA[incident.incidentType] || {
    icon: '📋',
    label: incident.incidentType,
    severity: 'MEDIUM',
    description: '',
  };

  const displayId = incident.backendId || incident.localId;
  const isFailed = incident.syncStatus === SYNC_STATUS.FAILED;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Incident Details"
        subtitle={`ID: ${displayId}`}
        onBack={() => navigation.goBack()}
        showConnectivity={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sync Failure Banner if FAILED */}
        {isFailed ? (
          <View style={styles.failureBanner}>
            <View style={styles.failureTextGroup}>
              <Text style={styles.failureTitle}>Synchronization Failed</Text>
              <Text style={styles.failureReason}>
                {incident.lastSyncError || 'Network timeout while uploading to EcoGuard.'}
              </Text>
            </View>
            <PrimaryButton
              title={retrying ? 'Retrying...' : 'Retry Sync'}
              onPress={handleRetrySync}
              loading={retrying}
              style={styles.retryBtn}
              variant="danger"
            />
          </View>
        ) : null}

        {/* Card 1: Overview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.typeRow}>
              <Text style={styles.typeIcon}>{meta.icon}</Text>
              <View>
                <Text style={styles.typeTitle}>{incident.incidentType}</Text>
                <Text style={styles.referenceId}>Ref: {displayId}</Text>
              </View>
            </View>
            <StatusBadge status={incident.syncStatus} />
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Reported By</Text>
            <Text style={styles.metaValue}>{incident.rangerName || 'Field Ranger'}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date & Time</Text>
            <Text style={styles.metaValue}>{formatDateTime(incident.reportedAt)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Threat Level</Text>
            <Text style={[styles.metaValue, { color: THEME.colors.primaryDark, fontWeight: '800' }]}>
              {meta.severity}
            </Text>
          </View>
        </View>

        {/* Card 2: GPS Location */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={styles.sectionTitle}>GPS Field Location</Text>
          </View>

          <View style={styles.coordsBox}>
            <View style={styles.coordCol}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <Text style={styles.coordValue}>{incident.latitude.toFixed(6)}°</Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordCol}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <Text style={styles.coordValue}>{incident.longitude.toFixed(6)}°</Text>
            </View>
          </View>

          {incident.accuracy ? (
            <Text style={styles.accuracyNote}>
              GPS Accuracy: ±{Math.round(incident.accuracy)} meters
            </Text>
          ) : null}

          {incident.addressSummary ? (
            <Text style={styles.addressSummary}>Area / Sector: {incident.addressSummary}</Text>
          ) : null}
        </View>

        {/* Card 3: Observation Description */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>📝</Text>
            <Text style={styles.sectionTitle}>Field Description & Notes</Text>
          </View>

          <Text style={styles.descriptionText}>{incident.description}</Text>
        </View>

        {/* Card 4: Photographic Evidence */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>📷</Text>
            <Text style={styles.sectionTitle}>Photographic Evidence</Text>
          </View>

          {incident.photoUri || incident.photoBase64 ? (
            <View style={styles.photoContainer}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderIcon}>🏞️</Text>
                <Text style={styles.photoPlaceholderText}>Photo Evidence Recorded</Text>
                <Text style={styles.photoPlaceholderSub}>
                  {incident.syncStatus === SYNC_STATUS.SYNCED
                    ? 'Uploaded to Cloud Database'
                    : 'Stored securely in device cache'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noPhotoText}>No photographic evidence was attached to this report.</Text>
          )}
        </View>

        {/* Card 5: Audit & Synchronization Traceability */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>🔍</Text>
            <Text style={styles.sectionTitle}>Audit & Synchronization</Text>
          </View>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Client Idempotency Key</Text>
            <Text style={styles.auditValue}>{incident.clientReferenceId}</Text>
          </View>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Sync Attempts</Text>
            <Text style={styles.auditValue}>{incident.syncAttempts}</Text>
          </View>

          {incident.backendId ? (
            <View style={styles.auditRow}>
              <Text style={styles.auditLabel}>Server ID</Text>
              <Text style={styles.auditValue}>{incident.backendId}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.base,
    paddingBottom: THEME.spacing.xxl,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
  },
  loadingText: {
    marginTop: THEME.spacing.md,
    fontSize: THEME.typography.sm,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 40,
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
    textAlign: 'center',
  },
  failureBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: THEME.colors.error,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.base,
    marginBottom: THEME.spacing.md,
  },
  failureTextGroup: {
    marginBottom: THEME.spacing.sm,
  },
  failureTitle: {
    fontSize: THEME.typography.base,
    fontWeight: '800',
    color: THEME.colors.error,
  },
  failureReason: {
    fontSize: THEME.typography.xs,
    color: '#991B1B',
    marginTop: 2,
  },
  retryBtn: {
    minHeight: 44,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.base,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  typeIcon: {
    fontSize: 28,
    marginRight: THEME.spacing.sm,
  },
  typeTitle: {
    fontSize: THEME.typography.lg,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  referenceId: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.borderLight,
    marginVertical: THEME.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: THEME.typography.sm,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
  },
  coordCol: {
    alignItems: 'center',
  },
  coordLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  coordValue: {
    fontSize: THEME.typography.base,
    color: THEME.colors.primaryDark,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  coordDivider: {
    width: 1,
    height: 28,
    backgroundColor: THEME.colors.border,
  },
  accuracyNote: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
  },
  addressSummary: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },
  descriptionText: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.textPrimary,
    lineHeight: 22,
  },
  photoContainer: {
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    backgroundColor: '#E8F5E9',
    paddingVertical: THEME.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  photoPlaceholderIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  photoPlaceholderText: {
    fontSize: THEME.typography.sm,
    fontWeight: '700',
    color: '#2E7D32',
  },
  photoPlaceholderSub: {
    fontSize: THEME.typography.xs,
    color: '#388E3C',
    marginTop: 2,
  },
  noPhotoText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  auditLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  auditValue: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontFamily: 'monospace',
  },
});

export default IncidentDetailsScreen;

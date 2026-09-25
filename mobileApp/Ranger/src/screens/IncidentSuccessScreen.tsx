import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { THEME } from '../constants/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { LocalIncidentRecord } from '../types/incident';
import { formatDateTime } from '../utils/helpers';
import { SYNC_STATUS } from '../constants/syncStatus';

interface IncidentSuccessScreenProps {
  route: {
    params: {
      incident: LocalIncidentRecord;
      isOnline: boolean;
    };
  };
  navigation: any;
}

export const IncidentSuccessScreen: React.FC<IncidentSuccessScreenProps> = ({
  route,
  navigation,
}) => {
  const { incident, isOnline } = route.params;

  const isSynced = incident.syncStatus === SYNC_STATUS.SYNCED && isOnline;
  const displayId = incident.backendId || incident.localId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Outcome Icon */}
        <View style={[styles.iconCircle, isSynced ? styles.iconOnline : styles.iconOffline]}>
          <Text style={styles.iconText}>{isSynced ? '✓' : '💾'}</Text>
        </View>

        {/* Headline */}
        <Text style={styles.title}>
          {isSynced ? 'Incident Submitted' : 'Offline Saved'}
        </Text>
        <Text style={styles.subtitle}>
          {isSynced
            ? 'Your field report has been successfully transmitted and logged into the central EcoGuard database.'
            : 'Your incident report is safely stored in local device storage.'}
        </Text>

        {!isSynced ? (
          <View style={styles.offlineNoteCard}>
            <Text style={styles.offlineNoteIcon}>⏳</Text>
            <Text style={styles.offlineNoteText}>
              It will automatically synchronize with EcoGuard servers as soon as internet connectivity returns.
            </Text>
          </View>
        ) : null}

        {/* Receipt Details Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Report Reference</Text>
            <Text style={styles.receiptValueId}>{displayId}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Incident Category</Text>
            <Text style={styles.receiptValue}>{incident.incidentType}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Logged Timestamp</Text>
            <Text style={styles.receiptValue}>{formatDateTime(incident.reportedAt)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Sync State</Text>
            <StatusBadge status={incident.syncStatus} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PrimaryButton
            title={isSynced ? 'View Incident Details' : 'View Pending Incidents'}
            onPress={() => {
              if (isSynced) {
                navigation.replace('IncidentDetails', {
                  incidentId: incident.localId,
                  incident,
                });
              } else {
                navigation.replace('SyncStatus');
              }
            }}
            icon={isSynced ? '📄' : '⏳'}
            style={styles.actionBtn}
          />

          <SecondaryButton
            title="Back to Dashboard"
            onPress={() => navigation.navigate('HomeTab')}
            icon="🏠"
            style={styles.actionBtn}
          />
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
    padding: THEME.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  iconOnline: {
    backgroundColor: THEME.colors.accent,
  },
  iconOffline: {
    backgroundColor: '#F59E0B',
  },
  iconText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: THEME.typography.heading,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.lg,
    lineHeight: 20,
    maxWidth: 320,
  },
  offlineNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    maxWidth: 340,
  },
  offlineNoteIcon: {
    fontSize: 20,
    marginRight: THEME.spacing.sm,
  },
  offlineNoteText: {
    fontSize: THEME.typography.xs,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xl,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xs,
  },
  receiptLabel: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  receiptValue: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  receiptValueId: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.primary,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.borderLight,
    marginVertical: THEME.spacing.sm,
  },
  actions: {
    width: '100%',
    gap: THEME.spacing.md,
  },
  actionBtn: {
    width: '100%',
  },
});

export default IncidentSuccessScreen;

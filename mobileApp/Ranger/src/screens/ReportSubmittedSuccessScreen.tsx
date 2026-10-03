import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConflictReport } from '../services/conflictApi';

interface ReportSubmittedSuccessProps {
  navigation: any;
  route: { params: { report: ConflictReport } };
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleString();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ReportSubmittedSuccessScreen: React.FC<ReportSubmittedSuccessProps> = ({
  navigation,
  route,
}) => {
  const report = route.params?.report || {
    reportId: 'CR-UNKNOWN',
    status: 'Pending Verification',
    reportedAt: new Date().toISOString(),
    animalSpecies: 'Wildlife',
    conflictType: 'Incident',
  };

  const statusLabel =
    report.status === 'Pending Verification' ? 'PENDING REVIEW' : report.status.toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <View style={styles.iconInnerCircle}>
            <Text style={styles.checkmarkEmoji}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>Report Submitted Successfully</Text>
        <Text style={styles.subtitle}>
          Your report has been logged and registered in the EcoGuard central field system.
        </Text>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Reference ID</Text>
            <Text style={styles.reportIdText}>#{report.reportId}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Submitted At</Text>
            <Text style={styles.cardValue}>{formatDate(report.reportedAt)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Animal & Conflict</Text>
            <Text style={styles.cardValue}>
              {report.animalSpecies} • {report.conflictType}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Current Status</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Message Banner */}
        <View style={styles.messageBanner}>
          <Text style={styles.messageIcon}>ℹ️</Text>
          <Text style={styles.messageText}>
            A Community Liaison Officer will review your report shortly for verification and ranger dispatch.
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              navigation.navigate('ConflictReportDetails', { reportId: report.reportId })
            }
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>VIEW REPORT STATUS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.replace('ReportWildlifeConflict')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>REPORT ANOTHER CONFLICT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.replace('CommunityMemberDashboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>RETURN TO DASHBOARD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  iconInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkEmoji: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  cardLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  reportIdText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1B4332',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
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
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    width: '100%',
  },
  messageIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  messageText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#1B4332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1B4332',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#1B4332',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  outlineBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ReportSubmittedSuccessScreen;

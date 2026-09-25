import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { THEME } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { RangerAlert } from '../types/incident';

const SAMPLE_ALERTS: RangerAlert[] = [
  {
    id: 'ALT-01',
    title: 'High Risk Poaching Advisory',
    description: 'Suspicious vehicle spotted near Sector 4 North boundary fence. Increase patrol vigilance.',
    timestamp: 'Today • 08:30 AM',
    severity: 'CRITICAL',
    read: false,
    type: 'risk',
  },
  {
    id: 'ALT-02',
    title: 'Incident INC-2026-9402 Acknowledged',
    description: 'Park Headquarters verified your wire snare report. Anti-poaching unit dispatched.',
    timestamp: 'Today • 07:15 AM',
    severity: 'MEDIUM',
    read: false,
    type: 'incident_ack',
  },
  {
    id: 'ALT-03',
    title: 'Weather Warning: Heavy Rainfall',
    description: 'Flash flood warnings issued for Block 1 river crossings. Maintain safe patrol distances.',
    timestamp: 'Yesterday • 04:45 PM',
    severity: 'HIGH',
    read: true,
    type: 'risk',
  },
  {
    id: 'ALT-04',
    title: 'Synchronization Check Complete',
    description: 'All 4 offline records from yesterday successfully synced with central server.',
    timestamp: 'Yesterday • 06:10 PM',
    severity: 'LOW',
    read: true,
    type: 'status_update',
  },
];

interface AlertsScreenProps {
  navigation: any;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = () => {
  const [alerts, setAlerts] = useState<RangerAlert[]>(SAMPLE_ALERTS);

  const toggleRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, read: !alert.read } : alert))
    );
  };

  const markAllRead = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Field Alerts" subtitle="Patrol Advisories" showConnectivity={true} />

      <View style={styles.subBar}>
        <Text style={styles.subBarText}>
          {alerts.filter((a) => !a.read).length} unread notices
        </Text>
        <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          let severityBg = '#FEF3C7';
          let severityColor = '#92400E';
          if (item.severity === 'CRITICAL') {
            severityBg = '#FEE2E2';
            severityColor = '#991B1B';
          } else if (item.severity === 'LOW') {
            severityBg = '#ECFDF5';
            severityColor = '#065F46';
          }

          return (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.cardUnread]}
              onPress={() => toggleRead(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.titleRow}>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                  <Text style={[styles.title, !item.read && styles.titleBold]}>{item.title}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: severityBg }]}>
                  <Text style={[styles.severityText, { color: severityColor }]}>
                    {item.severity}
                  </Text>
                </View>
              </View>

              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
                <Text style={styles.readAction}>{item.read ? 'Tap to mark unread' : 'Tap to mark read'}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  subBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.base,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  subBarText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  markReadText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: THEME.spacing.base,
    paddingBottom: THEME.spacing.xxl,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.base,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  cardUnread: {
    borderColor: THEME.colors.accent,
    backgroundColor: '#FAFDFB',
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.primary,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
    marginRight: 8,
  },
  title: {
    fontSize: THEME.typography.base,
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  titleBold: {
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radius.xs,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  description: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginVertical: THEME.spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  timestamp: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  readAction: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
});

export default AlertsScreen;

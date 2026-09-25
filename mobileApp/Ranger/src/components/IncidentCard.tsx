import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LocalIncidentRecord } from '../types/incident';
import { INCIDENT_TYPE_METADATA } from '../constants/incidentTypes';
import { StatusBadge } from './StatusBadge';
import { THEME } from '../constants/theme';
import { formatCoordinates, formatDateTime } from '../utils/helpers';

interface IncidentCardProps {
  incident: LocalIncidentRecord;
  onPress: () => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onPress }) => {
  const meta = INCIDENT_TYPE_METADATA[incident.incidentType] || {
    icon: '📋',
    label: incident.incidentType,
  };

  const displayId = incident.backendId || incident.localId;
  const locationText = incident.addressSummary || formatCoordinates(incident.latitude, incident.longitude);

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Incident report ${meta.label}, ID: ${displayId}, status: ${incident.syncStatus}`}
      activeOpacity={0.7}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View style={styles.typeContainer}>
          <Text style={styles.icon}>{meta.icon}</Text>
          <View>
            <Text style={styles.incidentType} numberOfLines={1}>
              {incident.incidentType}
            </Text>
            <Text style={styles.idText}>{displayId}</Text>
          </View>
        </View>
        <StatusBadge status={incident.syncStatus} size="sm" />
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailIcon}>🕒</Text>
        <Text style={styles.detailText}>{formatDateTime(incident.reportedAt)}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailIcon}>📍</Text>
        <Text style={styles.detailText} numberOfLines={1}>
          {locationText}
        </Text>
      </View>

      {incident.description ? (
        <Text style={styles.descriptionPreview} numberOfLines={2}>
          {incident.description}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.mediaIndicators}>
          {incident.photoUri || incident.photoBase64 ? (
            <View style={styles.photoIndicator}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoText}>Photo Attached</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.chevron}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.base,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  icon: {
    fontSize: 24,
    marginRight: THEME.spacing.sm,
  },
  incidentType: {
    fontSize: THEME.typography.base,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  idText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 6,
    color: THEME.colors.textMuted,
  },
  detailText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  descriptionPreview: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.sm,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  mediaIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.xs,
  },
  photoIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  photoText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    color: THEME.colors.primary,
    fontWeight: 'bold',
  },
});

export default IncidentCard;

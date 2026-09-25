import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SyncStatus, SYNC_STATUS_CONFIG } from '../constants/syncStatus';
import { THEME } from '../constants/theme';

interface StatusBadgeProps {
  status: SyncStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = SYNC_STATUS_CONFIG[status] || SYNC_STATUS_CONFIG.PENDING;
  const colorScheme = THEME.colors.status[config.colorKey];

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Synchronization status: ${config.accessibleName}`}
      style={[
        styles.badge,
        {
          backgroundColor: colorScheme.bg,
          borderColor: colorScheme.border,
        },
        size === 'sm' && styles.badgeSm,
        size === 'lg' && styles.badgeLg,
      ]}
    >
      <Text style={[styles.icon, { color: colorScheme.text }]}>{config.icon}</Text>
      <Text
        style={[
          styles.text,
          { color: colorScheme.text },
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
        ]}
      >
        {config.badgeText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeLg: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 6,
  },
  icon: {
    marginRight: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  text: {
    fontSize: THEME.typography.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 10,
  },
  textLg: {
    fontSize: THEME.typography.sm,
  },
});

export default StatusBadge;

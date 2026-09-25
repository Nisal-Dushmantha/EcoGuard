import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showConnectivity?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  showConnectivity = true,
}) => {
  const { isConnected, isSimulatedOffline, toggleSimulation } = useNetworkStatus();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          {onBack ? (
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Navigate back"
              style={styles.backButton}
              onPress={onBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          ) : null}
          <View>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        {showConnectivity ? (
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Network status: ${isConnected ? 'Online' : 'Offline'}. Tap to toggle test simulation.`}
            style={[
              styles.connectivityBadge,
              {
                backgroundColor: isConnected ? THEME.colors.status.synced.bg : THEME.colors.status.pending.bg,
                borderColor: isConnected ? THEME.colors.status.synced.border : THEME.colors.status.pending.border,
              },
            ]}
            onPress={toggleSimulation}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? THEME.colors.online : THEME.colors.offline },
              ]}
            />
            <Text
              style={[
                styles.connectivityText,
                { color: isConnected ? THEME.colors.status.synced.text : THEME.colors.status.pending.text },
              ]}
            >
              {isConnected ? 'Online' : 'Offline'}
              {isSimulatedOffline ? ' (Sim)' : ''}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.base,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  backButton: {
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: THEME.colors.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: THEME.typography.xl,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  connectivityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectivityText: {
    fontSize: THEME.typography.xs,
    fontWeight: '700',
  },
});

export default AppHeader;

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { IncidentLocation } from '../types/incident';
import { THEME } from '../constants/theme';
import { formatCoordinates } from '../utils/helpers';

interface LocationCardProps {
  location: IncidentLocation | null;
  loading: boolean;
  error?: string | null;
  onCapture: () => void;
  requiredError?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  loading,
  error,
  onCapture,
  requiredError,
}) => {
  return (
    <View
      style={[
        styles.card,
        (error || requiredError) && styles.cardError,
        location && styles.cardSuccess,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.title}>Current GPS Location</Text>
          <Text style={styles.required}>*</Text>
        </View>

        {location ? (
          <View style={styles.capturedBadge}>
            <Text style={styles.capturedText}>✓ Captured</Text>
          </View>
        ) : null}
      </View>

      {/* State: Loading */}
      {loading ? (
        <View style={styles.statusBox}>
          <ActivityIndicator color={THEME.colors.primary} size="small" />
          <Text style={styles.loadingText}>Acquiring high-accuracy GPS satellite fix...</Text>
        </View>
      ) : null}

      {/* State: Location Captured */}
      {!loading && location ? (
        <View style={styles.locationDetails}>
          <View style={styles.coordsRow}>
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <Text style={styles.coordValue}>{location.latitude.toFixed(6)}°</Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <Text style={styles.coordValue}>{location.longitude.toFixed(6)}°</Text>
            </View>
          </View>

          {location.accuracy ? (
            <Text style={styles.accuracyText}>
              Estimated Accuracy: ±{Math.round(location.accuracy)} meters
            </Text>
          ) : null}

          {location.addressSummary ? (
            <Text style={styles.addressText}>Sector: {location.addressSummary}</Text>
          ) : null}
        </View>
      ) : null}

      {/* State: Not yet captured and not loading */}
      {!loading && !location ? (
        <Text style={styles.placeholderText}>
          Field incident reports require precise GPS coordinates for patrol dispatch and GIS mapping.
        </Text>
      ) : null}

      {/* Error message */}
      {(error || requiredError) && !loading ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorText}>{error || requiredError}</Text>
        </View>
      ) : null}

      {/* Action button */}
      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={location ? 'Refresh GPS coordinates' : 'Get current GPS location'}
        activeOpacity={0.8}
        style={[styles.button, location && styles.buttonRefresh]}
        onPress={onCapture}
        disabled={loading}
      >
        <Text style={[styles.buttonText, location && styles.buttonRefreshText]}>
          {location ? '🔄 Refresh Location' : '📡 Get Current Location'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.base,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  cardSuccess: {
    borderColor: THEME.colors.accent,
    backgroundColor: '#F8FBF8',
  },
  cardError: {
    borderColor: THEME.colors.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
  },
  title: {
    fontSize: THEME.typography.base,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  required: {
    color: THEME.colors.error,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  capturedBadge: {
    backgroundColor: THEME.colors.status.synced.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.status.synced.border,
  },
  capturedText: {
    color: THEME.colors.status.synced.text,
    fontSize: THEME.typography.xs,
    fontWeight: '700',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
  },
  loadingText: {
    marginLeft: THEME.spacing.sm,
    fontSize: THEME.typography.sm,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.textMuted,
    lineHeight: 20,
    marginBottom: THEME.spacing.md,
  },
  locationDetails: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
  },
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  coordItem: {
    alignItems: 'center',
    flex: 1,
  },
  coordDivider: {
    width: 1,
    height: 30,
    backgroundColor: THEME.colors.border,
  },
  coordLabel: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  coordValue: {
    fontSize: THEME.typography.base,
    color: THEME.colors.primaryDark,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  accuracyText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
    fontWeight: '500',
  },
  addressText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.primary,
    textAlign: 'center',
    marginTop: 3,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: THEME.spacing.sm,
    borderRadius: THEME.radius.sm,
    marginBottom: THEME.spacing.sm,
  },
  errorIcon: {
    color: THEME.colors.error,
    marginRight: 6,
    fontSize: 14,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: THEME.typography.xs,
    fontWeight: '600',
    flex: 1,
  },
  button: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.touchTarget.minHeight,
    marginTop: THEME.spacing.xs,
  },
  buttonRefresh: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
  },
  buttonText: {
    color: THEME.colors.textInverse,
    fontSize: THEME.typography.base,
    fontWeight: '700',
  },
  buttonRefreshText: {
    color: THEME.colors.primary,
  },
});

export default LocationCard;

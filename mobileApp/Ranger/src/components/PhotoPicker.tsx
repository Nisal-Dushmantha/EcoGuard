import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { photoService } from '../services/photoService';

interface PhotoPickerProps {
  photoUri: string | null;
  onPhotoSelected: (uri: string, base64?: string) => void;
  onPhotoRemoved: () => void;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  photoUri,
  onPhotoSelected,
  onPhotoRemoved,
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  const handleTakePhoto = async () => {
    setLoading(true);
    try {
      const res = await photoService.takePhoto();
      if (res) onPhotoSelected(res.uri);
    } catch (err) {
      console.error('Failed to take photo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickGallery = async () => {
    setLoading(true);
    try {
      const res = await photoService.pickFromGallery();
      if (res) onPhotoSelected(res.uri);
    } catch (err) {
      console.error('Failed to pick photo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>📷</Text>
          <Text style={styles.title}>Photo Evidence</Text>
        </View>
        <Text style={styles.optional}>Optional</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={THEME.colors.primary} size="small" />
          <Text style={styles.loadingText}>Processing photo evidence...</Text>
        </View>
      ) : null}

      {!loading && photoUri ? (
        <View style={styles.previewContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: photoUri }}
              style={styles.previewImage}
              resizeMode="cover"
              accessible={true}
              accessibilityLabel="Captured evidence preview"
            />
            <View style={styles.imageOverlayBadge}>
              <Text style={styles.overlayBadgeText}>✓ Evidence Attached</Text>
            </View>
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.replaceButton}
              onPress={handleTakePhoto}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Replace photo evidence"
            >
              <Text style={styles.replaceText}>📷 Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.galleryButton}
              onPress={handlePickGallery}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Pick different photo from gallery"
            >
              <Text style={styles.galleryText}>🖼 Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={onPhotoRemoved}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Remove photo evidence"
            >
              <Text style={styles.removeText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!loading && !photoUri ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Take photo with camera"
          >
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionLabel}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.galleryActionButton]}
            onPress={handlePickGallery}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Choose photo from gallery"
          >
            <Text style={styles.actionIcon}>🖼️</Text>
            <Text style={styles.actionLabel}>From Gallery</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.base,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
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
  optional: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textMuted,
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.lg,
  },
  loadingText: {
    marginLeft: THEME.spacing.sm,
    fontSize: THEME.typography.sm,
    color: THEME.colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderLight,
    borderRadius: THEME.radius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.touchTarget.minHeight,
  },
  galleryActionButton: {
    backgroundColor: '#F3FAF5',
    borderColor: THEME.colors.accentLight,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: THEME.typography.sm,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  previewContainer: {
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 190,
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
    backgroundColor: '#1B2E1F',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(27, 46, 31, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
  },
  overlayBadgeText: {
    color: '#81C784',
    fontSize: THEME.typography.xs,
    fontWeight: '700',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  replaceButton: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 10,
    borderRadius: THEME.radius.sm,
    alignItems: 'center',
  },
  replaceText: {
    fontSize: THEME.typography.xs,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  galleryButton: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 10,
    borderRadius: THEME.radius.sm,
    alignItems: 'center',
  },
  galleryText: {
    fontSize: THEME.typography.xs,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: THEME.radius.sm,
    alignItems: 'center',
  },
  removeText: {
    fontSize: THEME.typography.xs,
    fontWeight: '700',
    color: THEME.colors.error,
  },
});

export default PhotoPicker;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { THEME } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { SelectField } from '../components/SelectField';
import { LocationCard } from '../components/LocationCard';
import { PhotoPicker } from '../components/PhotoPicker';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useLocation } from '../hooks/useLocation';
import { IncidentType } from '../constants/incidentTypes';
import { validateIncidentForm } from '../utils/validators';
import { generateLocalId } from '../utils/helpers';
import { LocalIncidentRecord } from '../types/incident';
import { SYNC_STATUS } from '../constants/syncStatus';
import { IncidentStorageService } from '../services/incidentStorage';
import { incidentApi } from '../services/incidentApi';

interface LogIncidentScreenProps {
  navigation: any;
}

export const LogIncidentScreen: React.FC<LogIncidentScreenProps> = ({ navigation }) => {
  const { isConnected } = useNetworkStatus();
  const { location, loading: locationLoading, error: locationError, captureLocation } = useLocation();

  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [description, setDescription] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discardModalVisible, setDiscardModalVisible] = useState<boolean>(false);

  // Automatically request GPS location on screen mount for seamless field usability
  useEffect(() => {
    captureLocation();
  }, [captureLocation]);

  const hasUnsavedChanges = Boolean(
    incidentType !== '' || description.trim().length > 0 || photoUri !== null
  );

  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      setDiscardModalVisible(true);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // 1. Validation
    const validation = validateIncidentForm({
      incidentType,
      location,
      description,
      photoUri,
      photoBase64,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const localId = generateLocalId();
    const reportedAt = new Date().toISOString();

    const record: LocalIncidentRecord = {
      localId,
      rangerId: 'RN-402',
      rangerName: 'Ranger K. Bandara',
      incidentType: incidentType as IncidentType,
      latitude: location!.latitude,
      longitude: location!.longitude,
      accuracy: location!.accuracy,
      addressSummary: location!.addressSummary,
      description: description.trim(),
      photoUri: photoUri || undefined,
      photoBase64: photoBase64 || undefined,
      reportedAt,
      syncStatus: isConnected ? SYNC_STATUS.SYNCING : SYNC_STATUS.PENDING,
      syncAttempts: isConnected ? 1 : 0,
      createdAt: reportedAt,
      updatedAt: reportedAt,
      clientReferenceId: localId,
    };

    try {
      if (isConnected) {
        // ONLINE FLOW
        // First save locally to guarantee offline resilience and audit trail
        await IncidentStorageService.saveIncident(record);

        try {
          const apiResult = await incidentApi.createIncident(record);
          const backendId = apiResult.data?.incidentId || apiResult.data?._id;

          const updated = await IncidentStorageService.updateSyncStatus(
            localId,
            SYNC_STATUS.SYNCED,
            undefined,
            { backendId }
          );

          navigation.replace('IncidentSuccess', {
            incident: updated || { ...record, syncStatus: SYNC_STATUS.SYNCED, backendId },
            isOnline: true,
          });
        } catch (apiErr: any) {
          // If server fails unexpectedly during online submission, fall back cleanly to PENDING!
          const errorMsg = apiErr.response?.data?.message || apiErr.message || 'Server upload failed';
          const pendingRecord = await IncidentStorageService.updateSyncStatus(
            localId,
            SYNC_STATUS.PENDING,
            errorMsg
          );

          navigation.replace('IncidentSuccess', {
            incident: pendingRecord || { ...record, syncStatus: SYNC_STATUS.PENDING },
            isOnline: false,
          });
        }
      } else {
        // OFFLINE FLOW
        record.syncStatus = SYNC_STATUS.PENDING;
        const saved = await IncidentStorageService.saveIncident(record);

        navigation.replace('IncidentSuccess', {
          incident: saved,
          isOnline: false,
        });
      }
    } catch (err: any) {
      Alert.alert('Storage Error', 'Failed to store incident record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Log Field Incident"
        subtitle="Ranger Operations • UC01"
        onBack={handleBackPress}
        showConnectivity={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION 1: INCIDENT CATEGORY */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionNumber}>1</Text>
              <Text style={styles.sectionTitle}>Incident Information</Text>
            </View>

            <SelectField
              label="Incident Type"
              value={incidentType}
              onChange={(val) => {
                setIncidentType(val);
                if (errors.incidentType) setErrors({ ...errors, incidentType: '' });
              }}
              error={errors.incidentType}
              required
            />
          </View>

          {/* SECTION 2: LOCATION */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionNumber}>2</Text>
              <Text style={styles.sectionTitle}>Current Location</Text>
            </View>

            <LocationCard
              location={location}
              loading={locationLoading}
              error={locationError}
              requiredError={errors.location}
              onCapture={captureLocation}
            />
          </View>

          {/* SECTION 3: EVIDENCE */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionNumber}>3</Text>
              <Text style={styles.sectionTitle}>Photographic Evidence</Text>
            </View>

            <PhotoPicker
              photoUri={photoUri}
              onPhotoSelected={(uri, base64) => {
                setPhotoUri(uri);
                if (base64) setPhotoBase64(base64);
              }}
              onPhotoRemoved={() => {
                setPhotoUri(null);
                setPhotoBase64(null);
              }}
            />
          </View>

          {/* SECTION 4: OBSERVATION DETAILS */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionNumber}>4</Text>
              <Text style={styles.sectionTitle}>Incident Details</Text>
            </View>

            <InputField
              label="Incident Description"
              placeholder="Describe what you observed at this location (e.g. wire snare type, animal tracks, estimated time of activity)..."
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              multiline={true}
              numberOfLines={4}
              maxLength={1500}
              showCharCount={true}
              error={errors.description}
              required
            />
          </View>

          {/* SECTION 5: NETWORK SUBMISSION STATUS BOX */}
          <View
            style={[
              styles.networkStatusCard,
              isConnected ? styles.networkOnlineCard : styles.networkOfflineCard,
            ]}
          >
            <Text style={styles.networkStatusIcon}>{isConnected ? '🌐' : '📡'}</Text>
            <View style={styles.networkStatusTextGroup}>
              <Text style={styles.networkStatusTitle}>
                {isConnected ? 'Network Connected (Online)' : 'Offline Mode Active'}
              </Text>
              <Text style={styles.networkStatusSubtitle}>
                {isConnected
                  ? 'Incident will be verified and sent directly to central EcoGuard database.'
                  : 'Incident will be safely stored on this device and synchronized when connectivity returns.'}
              </Text>
            </View>
          </View>

          {/* SECTION 6: SUBMIT BUTTON */}
          <PrimaryButton
            title={submitting ? 'Submitting Incident...' : 'Submit Incident Report'}
            onPress={handleSubmit}
            loading={submitting}
            icon={submitting ? undefined : '📤'}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Discard Warning Confirmation Modal */}
      <ConfirmationModal
        visible={discardModalVisible}
        title="Discard Incident Report?"
        message="You have unsaved incident information. Navigating away now will lose your recorded observations."
        confirmLabel="Discard Report"
        cancelLabel="Keep Editing"
        confirmVariant="danger"
        onConfirm={() => {
          setDiscardModalVisible(false);
          navigation.goBack();
        }}
        onCancel={() => setDiscardModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.base,
    paddingBottom: THEME.spacing.xxl,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  sectionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.colors.primary,
    color: THEME.colors.textInverse,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: THEME.typography.sm,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  networkStatusCard: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    borderWidth: 1.5,
    marginBottom: THEME.spacing.xl,
    alignItems: 'center',
  },
  networkOnlineCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  networkOfflineCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  networkStatusIcon: {
    fontSize: 24,
    marginRight: THEME.spacing.md,
  },
  networkStatusTextGroup: {
    flex: 1,
  },
  networkStatusTitle: {
    fontSize: THEME.typography.sm,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  networkStatusSubtitle: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  submitButton: {
    marginBottom: THEME.spacing.xl,
    minHeight: 52,
  },
});

export default LogIncidentScreen;

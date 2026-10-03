import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conflictApi } from '../services/conflictApi';
import { authService } from '../services/authService';
import { locationService } from '../services/locationService';
import { photoService, PhotoResult } from '../services/photoService';

interface ReportWildlifeConflictProps {
  navigation: any;
}

const ANIMAL_SPECIES_OPTIONS = [
  'Asian Elephant',
  'Sri Lankan Leopard',
  'Wild Boar',
  'Sloth Bear',
  'Mugger Crocodile',
  'Other',
];

const CONFLICT_TYPE_OPTIONS = [
  'Crop Raiding / Crop Damage',
  'Property Damage / Destruction',
  'Human Attack / Injury Threat',
  'Livestock Attack / Depredation',
  'Animal Trapped / Entangled',
  'Animal Injured / Sick',
  'Settlement Intrusion',
  'Other Conflict',
];

const SEVERITY_OPTIONS: ('Low' | 'Medium' | 'High' | 'Critical')[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

const PARKS_OPTIONS = [
  'Yala National Park',
  'Wilpattu National Park',
  'Udawalawe National Park',
  'Minneriya National Park',
  'Sinharaja Forest Reserve',
  'Boundary Village Sector',
];

// Helper Dropdown Component
const SelectDropdown = ({
  label,
  placeholder,
  value,
  options,
  onSelect,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: string;
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <TouchableOpacity
        style={[styles.dropdownBtn, error && styles.inputErrorBorder]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={value ? styles.dropdownBtnText : styles.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, value === item && styles.modalOptionActive]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[styles.modalOptionText, value === item && styles.modalOptionTextActive]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export const ReportWildlifeConflictScreen: React.FC<ReportWildlifeConflictProps> = ({
  navigation,
}) => {
  // ── Form State ─────────────────────────────────────────────────────────────
  const [animalSpecies, setAnimalSpecies] = useState('');
  const [herdSize, setHerdSize] = useState('1');
  const [conflictType, setConflictType] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  
  const [locationName, setLocationName] = useState('');
  const [park, setPark] = useState('Yala National Park');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<PhotoResult | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  // Reporter Profile (Auto-populated)
  const [reporterName, setReporterName] = useState(authService.userName || '');
  const [contactNumber, setContactNumber] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');

  // UI / Modal / Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch logged in profile for reporter details
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authService.getMe();
        if (res && res.user) {
          if (res.user.name) setReporterName(res.user.name);
          if (res.user.phoneNumber) setContactNumber(res.user.phoneNumber);
          if (res.user.email) setReporterEmail(res.user.email);
        }
      } catch {
        // Fallback to authService stored name
      }
    };
    loadProfile();
  }, []);

  // ── GPS Fetching ──────────────────────────────────────────────────────────
  const handleGetLocation = async () => {
    setFetchingGps(true);
    try {
      const res = await locationService.getCurrentLocation();
      if (res.success && res.location) {
        setLatitude(res.location.latitude);
        setLongitude(res.location.longitude);
        setGpsAddress(res.location.addressSummary || null);
        if (!locationName.trim()) {
          setLocationName(res.location.addressSummary || 'Captured Field GPS Position');
        }
      } else {
        Alert.alert('Location Error', res.error || 'Unable to get your current location.');
      }
    } catch {
      Alert.alert('Location Error', 'Unable to get your current location.');
    } finally {
      setFetchingGps(false);
    }
  };

  // ── Photo Capture / Pick ──────────────────────────────────────────────────
  const handleTakePhoto = async () => {
    setLoadingPhoto(true);
    try {
      const p = await photoService.takePhoto();
      setPhoto(p);
    } catch {
      Alert.alert('Image Error', 'Unable to capture image.');
    } finally {
      setLoadingPhoto(false);
    }
  };

  const handlePickPhoto = async () => {
    setLoadingPhoto(true);
    try {
      const p = await photoService.pickFromGallery();
      setPhoto(p);
    } catch {
      Alert.alert('Image Error', 'Unable to select image.');
    } finally {
      setLoadingPhoto(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!animalSpecies) errs.animalSpecies = 'Animal Type is required';
    if (!conflictType) errs.conflictType = 'Conflict Type is required';
    if (!locationName.trim()) errs.locationName = 'Location / Village / Area is required';
    if (!description.trim()) errs.description = 'Incident description is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Open confirmation modal
  const handlePressSubmit = () => {
    setSubmitError(null);
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  // Final Submit Action
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fullDesc = herdSize && parseInt(herdSize, 10) > 1
        ? `[Herd Size: ${herdSize}] ${description.trim()}`
        : description.trim();

      const created = await conflictApi.createConflictReport({
        reporterName: reporterName || 'Community Member',
        contactNumber: contactNumber || 'Not provided',
        conflictType,
        animalSpecies,
        severity,
        locationName: locationName.trim(),
        park,
        latitude,
        longitude,
        description: fullDesc,
        photoUrl: photo ? photo.uri : undefined,
      });

      setShowConfirmModal(false);
      // Navigate to Success screen
      navigation.replace('ReportSubmittedSuccess', { report: created });
    } catch (err: any) {
      setSubmitError(err.message || 'Unable to submit your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Report Wildlife Conflict</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.formHeaderSub}>
          Log a field incident for immediate Community Liaison Officer review & dispatch.
        </Text>

        {submitError ? (
          <View style={styles.globalErrorBox}>
            <Text style={styles.globalErrorIcon}>⚠️</Text>
            <Text style={styles.globalErrorText}>{submitError}</Text>
          </View>
        ) : null}

        {/* ── 1. Animal Information ───────────────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>1. ANIMAL INFORMATION</Text>

          <SelectDropdown
            label="Animal Type"
            placeholder="Select Animal Species"
            value={animalSpecies}
            options={ANIMAL_SPECIES_OPTIONS}
            onSelect={(val) => {
              setAnimalSpecies(val);
              if (errors.animalSpecies) setErrors({ ...errors, animalSpecies: '' });
            }}
            error={errors.animalSpecies}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Animals / Herd Size</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 1 or 5"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={herdSize}
              onChangeText={setHerdSize}
            />
          </View>
        </View>

        {/* ── 2. Conflict Classification ─────────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>2. CONFLICT CLASSIFICATION</Text>

          <SelectDropdown
            label="Conflict Type"
            placeholder="Select Conflict Category"
            value={conflictType}
            options={CONFLICT_TYPE_OPTIONS}
            onSelect={(val) => {
              setConflictType(val);
              if (errors.conflictType) setErrors({ ...errors, conflictType: '' });
            }}
            error={errors.conflictType}
          />

          <Text style={styles.inputLabel}>Severity / Urgency Level *</Text>
          <View style={styles.severityGrid}>
            {SEVERITY_OPTIONS.map((sev) => {
              const active = severity === sev;
              return (
                <TouchableOpacity
                  key={sev}
                  style={[
                    styles.severityPill,
                    active && styles.severityPillActive,
                    sev === 'Critical' && active && { backgroundColor: '#DC2626', borderColor: '#DC2626' },
                    sev === 'High' && active && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
                    sev === 'Medium' && active && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
                    sev === 'Low' && active && { backgroundColor: '#10B981', borderColor: '#10B981' },
                  ]}
                  onPress={() => setSeverity(sev)}
                >
                  <Text style={[styles.severityText, active && styles.severityTextActive]}>
                    {sev.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 3. Location & GPS ───────────────────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>3. LOCATION & GPS</Text>

          <SelectDropdown
            label="Assigned Wildlife Park / Area"
            placeholder="Select Wildlife Area"
            value={park}
            options={PARKS_OPTIONS}
            onSelect={setPark}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Village / Sector / Specific Location *</Text>
            <TextInput
              style={[styles.textInput, errors.locationName && styles.inputErrorBorder]}
              placeholder="e.g. Mahasenpura Village, Block 4 North Field"
              placeholderTextColor="#9CA3AF"
              value={locationName}
              onChangeText={(t) => {
                setLocationName(t);
                if (errors.locationName) setErrors({ ...errors, locationName: '' });
              }}
            />
            {errors.locationName ? <Text style={styles.errorText}>{errors.locationName}</Text> : null}
          </View>

          {/* GPS Coordinates Box */}
          <View style={styles.gpsBox}>
            <View style={styles.gpsHeader}>
              <Text style={styles.gpsTitle}>GPS Location Coordinates</Text>
              <TouchableOpacity
                style={styles.gpsBtn}
                onPress={handleGetLocation}
                disabled={fetchingGps}
              >
                {fetchingGps ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.gpsBtnText}>📍 Get Current Location</Text>
                )}
              </TouchableOpacity>
            </View>

            {latitude && longitude ? (
              <View style={styles.gpsDisplay}>
                <Text style={styles.gpsCoordText}>
                  Lat: {latitude.toFixed(5)}° N  |  Long: {longitude.toFixed(5)}° E
                </Text>
                {gpsAddress && <Text style={styles.gpsAddressText}>{gpsAddress}</Text>}
              </View>
            ) : (
              <Text style={styles.gpsHint}>
                Tap button above to auto-capture high-precision field coordinates.
              </Text>
            )}
          </View>
        </View>

        {/* ── 4. Incident Description ─────────────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>4. INCIDENT DESCRIPTION</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Field Observation / Short Description *</Text>
            <TextInput
              style={[styles.multilineInput, errors.description && styles.inputErrorBorder]}
              placeholder="Describe animal movement, damages, immediate danger, or direction of travel..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
          </View>
        </View>

        {/* ── 5. Photo / Evidence ─────────────────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>5. PHOTO / EVIDENCE (OPTIONAL)</Text>

          {photo ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: photo.uri }} style={styles.photoPreviewImage} />
              <View style={styles.photoActions}>
                <Text style={styles.photoFileName} numberOfLines={1}>
                  📷 {photo.fileName || 'Captured Evidence'}
                </Text>
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhoto(null)}>
                  <Text style={styles.removePhotoText}>Remove / Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photoBtnRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto} disabled={loadingPhoto}>
                <Text style={styles.photoBtnIcon}>📷</Text>
                <Text style={styles.photoBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto} disabled={loadingPhoto}>
                <Text style={styles.photoBtnIcon}>🖼</Text>
                <Text style={styles.photoBtnText}>Choose Image</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── 6. Reporter Information ─────────────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>6. REPORTER INFORMATION</Text>
          <View style={styles.reporterCard}>
            <View style={styles.reporterRow}>
              <View style={styles.reporterAvatar}>
                <Text style={styles.reporterAvatarText}>
                  {reporterName ? reporterName.substring(0, 2).toUpperCase() : 'CM'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reporterNameText}>{reporterName || 'Community Member'}</Text>
                <Text style={styles.reporterSubText}>
                  {contactNumber ? `Phone: ${contactNumber}` : 'Contact: Pre-filled from profile'}
                </Text>
                {reporterEmail ? <Text style={styles.reporterSubText}>Email: {reporterEmail}</Text> : null}
              </View>
              <View style={styles.autoVerifiedBadge}>
                <Text style={styles.autoVerifiedText}>✓ AUTHENTICATED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Primary Submit Button ────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handlePressSubmit}
          activeOpacity={0.88}
        >
          <Text style={styles.submitBtnText}>SUBMIT REPORT →</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── SCREEN 3: SUBMIT CONFIRMATION MODAL ───────────────────────────── */}
      <Modal visible={showConfirmModal} transparent animationType="fade" onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmHeaderIcon}>
              <Text style={styles.confirmHeaderEmoji}>⚠️</Text>
            </View>
            <Text style={styles.confirmTitle}>Submit this conflict report?</Text>
            <Text style={styles.confirmSub}>
              Please verify the compact summary before sending to field dispatch.
            </Text>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Animal:</Text>
                <Text style={styles.summaryValue}>
                  {animalSpecies} (Herd: {herdSize})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Conflict Type:</Text>
                <Text style={styles.summaryValue}>{conflictType}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Location:</Text>
                <Text style={styles.summaryValue}>{locationName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Severity:</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        severity === 'Critical'
                          ? '#DC2626'
                          : severity === 'High'
                          ? '#EF4444'
                          : severity === 'Medium'
                          ? '#F59E0B'
                          : '#10B981',
                      fontWeight: '800',
                    },
                  ]}
                >
                  {severity.toUpperCase()}
                </Text>
              </View>
            </View>

            {submitError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{submitError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSubmitBtn}
                onPress={handleConfirmSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmSubmitText}>Confirm & Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: '#374151', fontWeight: '700' },
  topBarTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  formHeaderSub: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 18 },

  globalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  globalErrorIcon: { fontSize: 16, marginRight: 8 },
  globalErrorText: { color: '#991B1B', fontSize: 13, fontWeight: '600', flex: 1 },

  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1B4332',
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  multilineInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  inputErrorBorder: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  errorText: { fontSize: 11, color: '#EF4444', fontWeight: '600', marginTop: 4 },

  // Dropdown
  dropdownBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownBtnText: { fontSize: 14, color: '#111827', fontWeight: '600' },
  dropdownPlaceholder: { fontSize: 14, color: '#9CA3AF' },
  dropdownArrow: { fontSize: 10, color: '#6B7280' },

  // Severity Grid
  severityGrid: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  severityPill: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  severityPillActive: { borderColor: '#1B4332' },
  severityText: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  severityTextActive: { color: '#FFFFFF', fontWeight: '800' },

  // GPS Box
  gpsBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gpsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gpsTitle: { fontSize: 12, fontWeight: '800', color: '#065F46' },
  gpsBtn: { backgroundColor: '#1B4332', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  gpsBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  gpsDisplay: { marginTop: 8 },
  gpsCoordText: { fontSize: 12, fontWeight: '700', color: '#047857', fontFamily: 'monospace' },
  gpsAddressText: { fontSize: 11, color: '#065F46', marginTop: 2 },
  gpsHint: { fontSize: 11, color: '#047857', marginTop: 6, fontStyle: 'italic' },

  // Photo
  photoBtnRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  photoBtnIcon: { fontSize: 24, marginBottom: 4 },
  photoBtnText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  photoPreviewBox: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  photoPreviewImage: { width: '100%', height: 160 },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  photoFileName: { fontSize: 12, color: '#374151', flex: 1, fontWeight: '500' },
  removePhotoBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  removePhotoText: { color: '#B91C1C', fontSize: 11, fontWeight: '700' },

  // Reporter Card
  reporterCard: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  reporterRow: { flexDirection: 'row', alignItems: 'center' },
  reporterAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reporterAvatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  reporterNameText: { fontSize: 14, fontWeight: '800', color: '#111827' },
  reporterSubText: { fontSize: 11, color: '#6B7280' },
  autoVerifiedBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  autoVerifiedText: { fontSize: 9, fontWeight: '800', color: '#047857' },

  // Submit button
  submitBtn: {
    backgroundColor: '#1B4332',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionActive: { backgroundColor: '#ECFDF5', borderRadius: 6, paddingHorizontal: 8 },
  modalOptionText: { fontSize: 14, color: '#374151' },
  modalOptionTextActive: { color: '#065F46', fontWeight: '800' },

  // Confirm Modal
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  confirmCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 380 },
  confirmHeaderIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  confirmHeaderEmoji: { fontSize: 24 },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 4 },
  confirmSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  summaryBox: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  summaryValue: { fontSize: 12, color: '#111827', fontWeight: '700', flex: 1, textAlign: 'right' },
  modalErrorBox: { backgroundColor: '#FEF2F2', padding: 8, borderRadius: 6, marginBottom: 12 },
  modalErrorText: { color: '#B91C1C', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  confirmSubmitBtn: { flex: 1.5, backgroundColor: '#1B4332', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmSubmitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});

export default ReportWildlifeConflictScreen;

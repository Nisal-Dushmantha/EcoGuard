import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/authService';

interface OfficerProfileScreenProps {
  navigation: any;
}

export const OfficerProfileScreen: React.FC<OfficerProfileScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isDutyActive, setIsDutyActive] = useState(true);

  // Modal States for Edit Profile & Change Password
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCallSign, setEditCallSign] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch real profile from backend/MongoDB
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.getMe();
      if (response && response.user) {
        const u = response.user;
        setProfile(u);
        setIsDutyActive(u.dutyStatus !== undefined ? u.dutyStatus : true);
        setEditName(u.name || '');
        setEditPhone(u.phoneNumber || '');
        setEditCallSign(u.callSign || '');
      } else {
        throw new Error('User profile data not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Real Logout Flow
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out from the field console? Your local session token will be invalidated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  // Toggle Duty Status with Real Backend Update
  const toggleDutyStatus = async () => {
    const nextStatus = !isDutyActive;
    setIsDutyActive(nextStatus);
    try {
      await authService.updateProfile({ dutyStatus: nextStatus });
    } catch (err: any) {
      // Revert if API call fails
      setIsDutyActive(!nextStatus);
      Alert.alert('Error', 'Failed to update duty status on server.');
    }
  };

  // Save Edit Profile
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Full Name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const res = await authService.updateProfile({
        name: editName.trim(),
        phoneNumber: editPhone.trim(),
        callSign: editCallSign.trim(),
      });
      if (res && res.user) {
        setProfile(res.user);
      }
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully.');
      loadProfile();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Save Password Change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully.');
    } catch (err: any) {
      Alert.alert('Password Change Failed', err.message || 'Incorrect current password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerBox}>
        <ActivityIndicator size="large" color="#1B4332" />
        <Text style={styles.loadingText}>Loading Ranger profile…</Text>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.centerBox}>
        <Text style={styles.errorText}>{error || 'Unable to load profile.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
          <Text style={styles.retryBtnText}>RETRY</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Format user role for display
  const displayRole =
    profile.role === 'COMMUNITY_LIAISON_OFFICER' || profile.role === 'Community Liaison Officer'
      ? 'Community Liaison Officer'
      : profile.role || 'Ranger';

  // Format officer initials
  const initials = profile.name
    ? profile.name
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'RN';

  const officerIdDisplay = profile.officerId || profile.id || profile._id || 'Not assigned';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Ranger Profile</Text>
          <Text style={styles.headerSubtitle}>FIELD OPERATIONS CONSOLE</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowEditModal(true)}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Gov Banner ── */}
        <View style={styles.govBanner}>
          <View style={styles.govLogoCircle}>
            <Text style={styles.govLogoIcon}>🛡️</Text>
          </View>
          <View style={styles.govTextGroup}>
            <Text style={styles.govTitleSmall}>DEMOCRATIC SOCIALIST REPUBLIC</Text>
            <Text style={styles.govTitleLarge}>Dept. of Wildlife Conservation</Text>
            <Text style={styles.govTitleSub}>Field Command & Rapid Liaison Force</Text>
          </View>
        </View>

        {/* ── Profile Main Card ── */}
        <View style={styles.card}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
              <View style={[styles.onlineDot, { backgroundColor: isDutyActive ? '#10B981' : '#9CA3AF' }]} />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.verifiedIcon}>✅</Text>
              </View>
              <Text style={styles.profileRole}>{displayRole}</Text>
              <View style={styles.clearanceBadge}>
                <Text style={styles.clearanceText}>🔒 Tier 4 Clearance — Authenticated</Text>
              </View>
            </View>
          </View>

          <View style={styles.deptRow}>
            <Text style={styles.deptIcon}>🏛️</Text>
            <Text style={styles.deptText}>Department of Wildlife Conservation & Field Operations.</Text>
          </View>

          {/* ── Duty Status Toggle Switch ── */}
          <View style={[styles.dutyToggleRow, isDutyActive ? styles.dutyActiveBg : styles.dutyInactiveBg]}>
            <View style={styles.dutyInfo}>
              <View style={styles.dutyStatusRow}>
                <View style={[styles.dutyStatusDot, { backgroundColor: isDutyActive ? '#10B981' : '#6B7280' }]} />
                <Text style={styles.dutyStatusTitle}>
                  {isDutyActive ? `ON DUTY - ${profile.assignedPark || 'Yala National Park'}` : 'OFF DUTY'}
                </Text>
              </View>
              <Text style={styles.dutyStatusSub}>
                {isDutyActive ? 'Active field dispatch channel locked' : 'Dispatch channel offline'}
              </Text>
            </View>
            <Switch
              value={isDutyActive}
              onValueChange={toggleDutyStatus}
              trackColor={{ false: '#D1D5DB', true: '#047857' }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* ── Field Credentials & Database Manifest ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>🪪</Text>
              <Text style={styles.sectionHeaderTitle}>Field Credentials &{'\n'}Database Manifest</Text>
            </View>
            <View style={styles.authenticatedBadge}>
              <Text style={styles.authenticatedText}>DATABASE LIVE</Text>
            </View>
          </View>

          {/* Officer ID */}
          <View style={styles.credentialRow}>
            <Text style={styles.credIcon}>🆔</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>OFFICER ID / USER TOKEN</Text>
              <Text style={styles.credValue}>
                {officerIdDisplay.length > 18 ? officerIdDisplay.slice(0, 18) + '...' : officerIdDisplay}
              </Text>
            </View>
            <Text style={styles.credActionIcon}>📋</Text>
          </View>

          {/* Call Sign */}
          <View style={styles.credentialRow}>
            <Text style={styles.credIcon}>📡</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>TACTICAL RADIO CALL SIGN</Text>
              <Text style={styles.credValue}>{profile.callSign || 'Not assigned'}</Text>
            </View>
            <View style={styles.radioBadge}>
              <Text style={styles.radioBadgeText}>CH-04</Text>
            </View>
          </View>

          {/* Email */}
          <View style={styles.credentialRow}>
            <Text style={styles.credIcon}>✉️</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>OFFICIAL WILDLIFE GATEWAY EMAIL</Text>
              <Text style={styles.credValue}>{profile.email}</Text>
            </View>
            <Text style={styles.credVerifiedIcon}>✅</Text>
          </View>

          {/* Phone Number */}
          <View style={styles.credentialRow}>
            <Text style={styles.credIcon}>📞</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>FIELD CELLULAR HOTLINE</Text>
              <Text style={styles.credValue}>{profile.phoneNumber || 'Not assigned'}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowEditModal(true)}>
              <Text style={styles.credActionIcon}>✏️</Text>
            </TouchableOpacity>
          </View>

          {/* Station / Assigned Park */}
          <View style={[styles.credentialRow, styles.lastCredentialRow]}>
            <Text style={styles.credIcon}>🏢</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>ASSIGNED STATION / PARK</Text>
              <Text style={styles.credValue}>{profile.assignedPark || 'Not assigned'}</Text>
              <Text style={styles.credSubValue}>Elephant Corridor Sector 02</Text>
            </View>
          </View>
        </View>

        {/* ── Security & Operational Preferences ── */}
        <View style={styles.preferencesSection}>
          <Text style={styles.preferencesHeader}>
            <Text style={styles.prefHeaderIcon}>🛡️</Text> Security & Operational Preferences
          </Text>

          {/* Edit Profile Action */}
          <TouchableOpacity style={styles.prefRow} onPress={() => setShowEditModal(true)}>
            <Text style={styles.prefIcon}>👤</Text>
            <View style={styles.prefTextGroup}>
              <Text style={styles.prefTitle}>Edit Profile Details</Text>
              <Text style={styles.prefSub}>Update full name, phone hotline, tactical call sign</Text>
            </View>
            <Text style={styles.prefChevron}>›</Text>
          </TouchableOpacity>

          {/* Change Password Action */}
          <TouchableOpacity style={styles.prefRow} onPress={() => setShowPasswordModal(true)}>
            <Text style={styles.prefIcon}>🔑</Text>
            <View style={styles.prefTextGroup}>
              <Text style={styles.prefTitle}>Change Officer Password</Text>
              <Text style={styles.prefSub}>Update account security passkey</Text>
            </View>
            <Text style={styles.prefChevron}>›</Text>
          </TouchableOpacity>

          {/* Operational Notifications */}
          <TouchableOpacity style={styles.prefRow}>
            <Text style={styles.prefIcon}>🔔</Text>
            <View style={styles.prefTextGroup}>
              <Text style={styles.prefTitle}>Operational Notification Preferences</Text>
              <View style={styles.badgesRow}>
                <View style={styles.smallBadgeGreen}><Text style={styles.smallBadgeGreenText}>VHF Alerts</Text></View>
                <View style={styles.smallBadgeGray}><Text style={styles.smallBadgeGrayText}>Push</Text></View>
                <View style={styles.smallBadgeGray}><Text style={styles.smallBadgeGrayText}>SMS</Text></View>
              </View>
            </View>
            <Text style={styles.prefChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer Info ── */}
        <View style={styles.footerInfoBox}>
          <View style={styles.footerVersionRow}>
            <Text style={styles.footerShield}>🛡️ WildGuard Ops Mobile v2.4.1</Text>
            <Text style={styles.footerBuild}>Build 4328</Text>
          </View>
          <View style={styles.fipsBadge}>
            <View style={styles.fipsDot} />
            <Text style={styles.fipsText}>MongoDB Encrypted Auth Channel Active</Text>
          </View>
        </View>

        {/* ── Logout Button ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>LOGOUT FROM FIELD CONSOLE</Text>
        </TouchableOpacity>
        <Text style={styles.logoutHint}>Terminating session invalidates temporary tactical passkeys</Text>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Modal 1: Edit Profile Details ── */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Details</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>FIELD PHONE HOTLINE</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+94 77 123 4567"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>TACTICAL CALL SIGN (OPTIONAL)</Text>
            <TextInput
              style={styles.modalInput}
              value={editCallSign}
              onChangeText={setEditCallSign}
              placeholder="LIAISON-DELTA-1"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />

            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>🔒 Role ({displayRole}) and Assigned Park ({profile.assignedPark}) are managed by System Admin.</Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal 2: Change Password ── */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Officer Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min 6 characters"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleChangePassword} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Update Password</Text>
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
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#4B5563', fontWeight: '500' },
  errorText: { fontSize: 14, color: '#DC2626', fontWeight: '600', marginBottom: 16 },
  retryBtn: { backgroundColor: '#1B4332', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800' },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 22, color: '#374151', fontWeight: '700' },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  settingsBtn: { padding: 4 },
  settingsIcon: { fontSize: 20 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },

  govBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B4332',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  govLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  govLogoIcon: { fontSize: 24 },
  govTextGroup: { flex: 1 },
  govTitleSmall: { fontSize: 9, color: '#A7F3D0', fontWeight: '800', letterSpacing: 0.5 },
  govTitleLarge: { fontSize: 15, color: '#FFFFFF', fontWeight: '900', marginVertical: 2 },
  govTitleSub: { fontSize: 10, color: '#D1FAE5', fontWeight: '600' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#065F46' },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  profileName: { fontSize: 17, fontWeight: '800', color: '#111827', marginRight: 6 },
  verifiedIcon: { fontSize: 14 },
  profileRole: { fontSize: 13, color: '#374151', fontWeight: '600', marginTop: 2, marginBottom: 6 },
  clearanceBadge: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  clearanceText: { fontSize: 10, color: '#1D4ED8', fontWeight: '700' },

  deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  deptIcon: { fontSize: 14, marginRight: 8, color: '#6B7280' },
  deptText: { fontSize: 11, color: '#6B7280', flex: 1 },

  dutyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dutyActiveBg: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  dutyInactiveBg: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  dutyInfo: { flex: 1, marginRight: 12 },
  dutyStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dutyStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dutyStatusTitle: { fontSize: 12, fontWeight: '800', color: '#111827' },
  dutyStatusSub: { fontSize: 10, color: '#4B5563' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionHeaderLeft: { flexDirection: 'row' },
  sectionHeaderIcon: { fontSize: 20, marginRight: 8 },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#374151', lineHeight: 18 },
  authenticatedBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  authenticatedText: { color: '#065F46', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  lastCredentialRow: { marginBottom: 0 },
  credIcon: { fontSize: 18, marginRight: 12, opacity: 0.8 },
  credTextGroup: { flex: 1 },
  credLabel: { fontSize: 9, color: '#6B7280', fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  credValue: { fontSize: 13, color: '#111827', fontWeight: '700' },
  credSubValue: { fontSize: 10, color: '#4B5563', marginTop: 2 },
  credActionIcon: { fontSize: 16, color: '#6B7280', marginLeft: 8 },
  credVerifiedIcon: { fontSize: 14, marginLeft: 8 },
  radioBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  radioBadgeText: { fontSize: 10, fontWeight: '800', color: '#065F46' },

  preferencesSection: { marginBottom: 20 },
  preferencesHeader: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 12, marginLeft: 4 },
  prefHeaderIcon: { fontSize: 14 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  prefIcon: { fontSize: 20, marginRight: 12 },
  prefTextGroup: { flex: 1 },
  prefTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 2 },
  prefSub: { fontSize: 11, color: '#6B7280' },
  prefChevron: { fontSize: 20, color: '#9CA3AF', marginLeft: 8 },

  badgesRow: { flexDirection: 'row', marginTop: 4, gap: 6 },
  smallBadgeGreen: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  smallBadgeGreenText: { fontSize: 9, fontWeight: '800', color: '#065F46' },
  smallBadgeGray: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  smallBadgeGrayText: { fontSize: 9, fontWeight: '800', color: '#4B5563' },

  footerInfoBox: { marginBottom: 16 },
  footerVersionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 8 },
  footerShield: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  footerBuild: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  fipsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fipsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 8 },
  fipsText: { fontSize: 10, color: '#4B5563', fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 8,
  },
  logoutIcon: { fontSize: 16, marginRight: 8 },
  logoutText: { fontSize: 13, fontWeight: '800', color: '#B91C1C' },
  logoutHint: { textAlign: 'center', fontSize: 10, color: '#9CA3AF' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  modalCloseText: { fontSize: 18, color: '#9CA3AF', fontWeight: '700' },

  inputLabel: { fontSize: 10, fontWeight: '800', color: '#374151', marginBottom: 4, letterSpacing: 0.5 },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  readOnlyBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  readOnlyText: { fontSize: 11, color: '#1E40AF' },

  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6' },
  modalCancelText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
  modalSaveBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1B4332' },
  modalSaveText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});

export default OfficerProfileScreen;

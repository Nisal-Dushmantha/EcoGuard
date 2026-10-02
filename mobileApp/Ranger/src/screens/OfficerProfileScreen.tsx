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

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.getMe();
      if (response && response.user) {
        setProfile(response.user);
      } else {
        throw new Error('User data not found.');
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

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out from the field console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const toggleDutyStatus = () => {
    setIsDutyActive((prev) => !prev);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerBox}>
        <ActivityIndicator size="large" color="#1B4332" />
        <Text style={styles.loadingText}>Loading profile...</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Header ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Officer Profile</Text>
          <Text style={styles.headerSubtitle}>FIELD OPERATIONS CONSOLE</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
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

        {/* ── Profile Card ── */}
        <View style={styles.card}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profile.name ? profile.name.substring(0, 2).toUpperCase() : 'CO'}
              </Text>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.verifiedIcon}>✅</Text>
              </View>
              <Text style={styles.profileRole}>
                {profile.role === 'Community Liaison Officer' ? 'Community Liaison Officer' : profile.role}
              </Text>
              <View style={styles.clearanceBadge}>
                <Text style={styles.clearanceText}>🔒 Tier 4 Clearance — Pre-cleared</Text>
              </View>
            </View>
          </View>

          <View style={styles.deptRow}>
            <Text style={styles.deptIcon}>🏛️</Text>
            <Text style={styles.deptText}>Department of Wildlife Conservation & Field Operations.</Text>
          </View>

          <View style={[styles.dutyToggleRow, isDutyActive ? styles.dutyActiveBg : styles.dutyInactiveBg]}>
            <View style={styles.dutyInfo}>
              <View style={styles.dutyStatusRow}>
                <View style={[styles.dutyStatusDot, { backgroundColor: isDutyActive ? '#10B981' : '#6B7280' }]} />
                <Text style={styles.dutyStatusTitle}>
                  {isDutyActive ? `ON DUTY - ${profile.assignedPark}` : 'OFF DUTY'}
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

        {/* ── Field Credentials & Manifest ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>🪪</Text>
              <Text style={styles.sectionHeaderTitle}>Field Credentials &{'\n'}Manifest</Text>
            </View>
            <View style={styles.authenticatedBadge}>
              <Text style={styles.authenticatedText}>AUTHENTICATED</Text>
            </View>
          </View>

          <View style={styles.credentialRow}>
            <Text style={styles.credIcon}>🆔</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>OFFICER ID / TOKEN</Text>
              <Text style={styles.credValue}>{profile.id ? profile.id.slice(0, 15).toUpperCase() : 'Not assigned'}</Text>
            </View>
            <Text style={styles.credActionIcon}>📋</Text>
          </View>

          <View style={styles.credentialRow}>
            <Text style={styles.credIcon}>📡</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>TACTICAL RADIO CALL SIGN</Text>
              <Text style={styles.credValue}>Not assigned</Text>
            </View>
            <View style={styles.radioBadge}>
              <Text style={styles.radioBadgeText}>CH-04</Text>
            </View>
          </View>

          <View style={styles.credentialRow}>
            <Text style={styles.credIcon}>✉️</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>OFFICIAL WILDLIFE GATEWAY EMAIL</Text>
              <Text style={styles.credValue}>{profile.email}</Text>
            </View>
            <Text style={styles.credVerifiedIcon}>✅</Text>
          </View>

          <View style={styles.credentialRow}>
            <Text style={styles.credIcon}>📞</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>FIELD CELLULAR HOTLINE</Text>
              <Text style={styles.credValue}>Not assigned</Text>
            </View>
            <Text style={styles.credActionIcon}>📞</Text>
          </View>

          <View style={[styles.credentialRow, styles.lastCredentialRow]}>
            <Text style={styles.credIcon}>🏢</Text>
            <View style={styles.credTextGroup}>
              <Text style={styles.credLabel}>ASSIGNED STATION / OUTPOST</Text>
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

          <TouchableOpacity style={styles.prefRow}>
            <Text style={styles.prefIcon}>👤</Text>
            <View style={styles.prefTextGroup}>
              <Text style={styles.prefTitle}>Edit Profile Details</Text>
              <Text style={styles.prefSub}>Contact number, alternate liaison phone</Text>
            </View>
            <Text style={styles.prefChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.prefRow}>
            <Text style={styles.prefIcon}>🔑</Text>
            <View style={styles.prefTextGroup}>
              <Text style={styles.prefTitle}>Change Officer Password & Radio Passkey</Text>
              <Text style={styles.prefSub}>AES-256 frequency hopping token</Text>
            </View>
            <Text style={styles.prefChevron}>›</Text>
          </TouchableOpacity>

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

          <TouchableOpacity style={styles.prefRow}>
            <Text style={styles.prefIcon}>📄</Text>
            <View style={styles.prefTextGroup}>
              <Text style={styles.prefTitle}>Field Protocol & Dispatch Manual</Text>
              <Text style={styles.prefSub}>Standard Operating Procedure Rev 4.2</Text>
              <Text style={styles.prefSub}>(PDF - 14.8 MB)</Text>
            </View>
            <Text style={styles.prefActionIcon}>📥</Text>
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
            <Text style={styles.fipsText}>FIPS 140-3 Cryptographic Field Tunnel Active</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
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
    backgroundColor: '#F9FAFB',
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 24, color: '#374151', fontWeight: '600' },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 1 },
  settingsBtn: { padding: 4 },
  settingsIcon: { fontSize: 20 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

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
  govTitleLarge: { fontSize: 16, color: '#FFFFFF', fontWeight: '900', marginVertical: 2 },
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
  avatarText: { fontSize: 24, fontWeight: '800', color: '#065F46' },
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
  profileName: { fontSize: 18, fontWeight: '800', color: '#111827', marginRight: 6 },
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
  prefActionIcon: { fontSize: 18, color: '#4B5563', marginLeft: 8 },
  
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
});

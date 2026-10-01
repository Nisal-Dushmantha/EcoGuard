import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/authService';

interface RegisterScreenProps {
  navigation: any;
}

const AVAILABLE_PARKS = [
  'Yala National Park',
  'Wilpattu National Park',
  'Udawalawe National Park',
  'Minneriya National Park',
  'Sinharaja Forest Reserve',
];

const AVAILABLE_ZONES = [
  'Grid 44-North',
  'Sector 1',
  'Sector 2',
  'Sector 3',
  'Sector 4',
];

const ROLES = [
  'Park Manager',
  'Ranger',
  'Community Liaison Officer',
  'Conservation Researcher',
];

const DropdownField = ({ label, value, options, onSelect, error, placeholder }: any) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity 
        style={[styles.dropdownButton, error && styles.inputError]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={value ? styles.dropdownButtonText : styles.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      {error ? (
        <View style={styles.inlineErrorBox}>
          <Text style={styles.inlineErrorIcon}>⚠️</Text>
          <Text style={styles.inlineErrorText}>{error}</Text>
        </View>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, value === item && styles.modalItemActive]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, value === item && styles.modalItemTextActive]}>
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

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [assignedPark, setAssignedPark] = useState('');
  const [assignedZone, setAssignedZone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      const isOnline = await authService.checkHealth();
      if (isMounted) {
        setBackendStatus(isOnline ? 'online' : 'offline');
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full Name is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid Official Email is required';
    if (!role) newErrors.role = 'System Role is required';
    if (!assignedPark) newErrors.assignedPark = 'Assigned Park is required';
    if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setServerError(null);
    setSuccessMessage(null);

    if (!validate()) return;
    if (backendStatus === 'offline') return; // Enforce disabled button physically

    setLoading(true);

    try {
      await authService.register({
        name,
        email,
        password,
        role,
        assignedPark,
        // Optional grid/zone could be sent to backend here if supported
      });
      setSuccessMessage('Account created successfully');
      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    } catch (err: any) {
      setServerError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = () => {
    if (backendStatus === 'online') return 'Connected to Secure Grid';
    if (backendStatus === 'offline') return 'No internet connection';
    return 'Establishing Secure Link…';
  };

  const getStatusSubtext = () => {
    if (backendStatus === 'offline') return 'Connect to the internet to complete registration.';
    return null;
  };

  const isOffline = backendStatus === 'offline';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Area */}
          <View style={styles.brandContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
            />
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>Register to access Wildlife Conservation & Field Operations</Text>
          </View>

          {/* Register Card */}
          <View style={styles.card}>
            <View style={[styles.statusBox, isOffline ? styles.statusOffline : styles.statusOnline]}>
               <View style={[styles.statusDot, isOffline ? styles.dotOffline : styles.dotOnline]} />
               <View>
                 <Text style={[styles.statusText, isOffline ? styles.textOffline : styles.textOnline]}>{getStatusText()}</Text>
                 {getStatusSubtext() && (
                   <Text style={[styles.statusSubtext, isOffline ? styles.textOffline : styles.textOnline]}>{getStatusSubtext()}</Text>
                 )}
               </View>
            </View>

            {serverError ? (
              <View style={styles.serverErrorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <InputField
                label=""
                placeholder="e.g. Nisal Dushmantha"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({...errors, name: ''});
                }}
                editable={!loading}
              />
              {errors.name ? (
                <View style={styles.inlineErrorBox}>
                  <Text style={styles.inlineErrorIcon}>⚠️</Text>
                  <Text style={styles.inlineErrorText}>{errors.name}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Official Email Address</Text>
              <InputField
                label=""
                placeholder="e.g. nisal@ecoguard.lk"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({...errors, email: ''});
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
              {errors.email ? (
                <View style={styles.inlineErrorBox}>
                  <Text style={styles.inlineErrorIcon}>⚠️</Text>
                  <Text style={styles.inlineErrorText}>{errors.email}</Text>
                </View>
              ) : null}
            </View>

            <DropdownField
              label="System Role"
              placeholder="Select Role"
              value={role}
              options={ROLES}
              onSelect={(val: string) => {
                setRole(val);
                if (errors.role) setErrors({...errors, role: ''});
              }}
              error={errors.role}
            />

            <DropdownField
              label="Assigned Park"
              placeholder="Select Park"
              value={assignedPark}
              options={AVAILABLE_PARKS}
              onSelect={(val: string) => {
                setAssignedPark(val);
                if (errors.assignedPark) setErrors({...errors, assignedPark: ''});
              }}
              error={errors.assignedPark}
            />

            <DropdownField
              label="Assigned Zone / Grid"
              placeholder="Optional"
              value={assignedZone}
              options={AVAILABLE_ZONES}
              onSelect={(val: string) => setAssignedZone(val)}
            />

            <View style={styles.passwordContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <InputField
                label=""
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({...errors, password: ''});
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
                helperText="Minimum 6 characters"
              />
              <TouchableOpacity
                style={styles.togglePasswordBtn}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.togglePasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
              {errors.password ? (
                <View style={styles.inlineErrorBox}>
                  <Text style={styles.inlineErrorIcon}>⚠️</Text>
                  <Text style={styles.inlineErrorText}>{errors.password}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <InputField
                label=""
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              {errors.confirmPassword ? (
                <View style={styles.inlineErrorBox}>
                  <Text style={styles.inlineErrorIcon}>⚠️</Text>
                  <Text style={styles.inlineErrorText}>{errors.confirmPassword}</Text>
                </View>
              ) : null}
            </View>

            <PrimaryButton
              title={loading ? 'Creating...' : 'CREATE ACCOUNT'}
              onPress={handleRegister}
              loading={loading}
              disabled={isOffline || loading}
              style={[styles.registerButton, isOffline && styles.buttonDisabled]}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>LOGIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F261B', // Dark Green
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#52B788',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#A7F3D0',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusOnline: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusOffline: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  textOnline: {
    color: '#065F46',
  },
  textOffline: {
    color: '#991B1B',
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  serverErrorText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#065F46',
    fontWeight: '900',
  },
  successText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '700',
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    marginLeft: 4,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  inlineErrorIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  inlineErrorText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0DDD2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 52,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#6B7280',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemActive: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  modalItemText: {
    fontSize: 16,
    color: '#4B5563',
  },
  modalItemTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  togglePasswordBtn: {
    position: 'absolute',
    right: 12,
    top: 38,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 4,
  },
  togglePasswordText: {
    fontSize: 12,
    color: '#2D6A4F',
    fontWeight: '700',
  },
  registerButton: {
    marginTop: 24,
    backgroundColor: '#1B4332',
    borderRadius: 12,
    paddingVertical: 18,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#4B5563',
  },
  loginLink: {
    fontSize: 14,
    color: '#2D6A4F',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/authService';

interface LoginScreenProps {
  navigation: any;
  onLoginSuccess?: (user: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  navigation,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login({ email, password });
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
      if (result.user.role === 'Community Liaison Officer') {
        navigation.replace('ConflictOperationsHome');
      } else if (result.user.role === 'Ranger') {
        navigation.replace('RangerHome');
      } else {
        navigation.replace('RangerMainTabs');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = () => {
    if (backendStatus === 'online') return 'Connected to Secure Grid';
    if (backendStatus === 'offline') return 'Offline - Check connection';
    return 'Establishing Secure Link…';
  };

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
          {/* Brand & Emblem Area */}
          <View style={styles.brandContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
            />
            <Text style={styles.brandTitle}>Wildlife Dispatch</Text>
            <Text style={styles.brandSubtitle}>Secure Login Required</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <View style={[styles.statusBox, backendStatus === 'offline' ? styles.statusOffline : styles.statusOnline]}>
               <View style={[styles.statusDot, backendStatus === 'offline' ? styles.dotOffline : styles.dotOnline]} />
               <Text style={[styles.statusText, backendStatus === 'offline' ? styles.textOffline : styles.textOnline]}>{getStatusText()}</Text>
            </View>

            {error ? (
              <View style={styles.serverErrorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.serverErrorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Official Email Address</Text>
              <InputField
                label=""
                placeholder="ranger@ecoguard.gov"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.passwordContainer}>
              <Text style={styles.inputLabel}>Secure Password</Text>
              <InputField
                label=""
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.togglePasswordBtn}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.togglePasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton
              title={loading ? 'Authenticating...' : 'Sign In'}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Not registered on Grid 44? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Enroll here</Text>
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
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#A7F3D0',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
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
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  inputWrapper: {
    marginBottom: -10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    marginLeft: 4,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 10,
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
  loginButton: {
    marginTop: 10,
    backgroundColor: '#1B4332',
    borderRadius: 12,
    paddingVertical: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#4B5563',
  },
  registerLink: {
    fontSize: 14,
    color: '#2D6A4F',
    fontWeight: '700',
  },
});

export default LoginScreen;

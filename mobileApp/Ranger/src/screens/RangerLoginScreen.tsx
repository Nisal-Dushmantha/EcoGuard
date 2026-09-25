import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { THEME } from '../constants/theme';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { validateRangerLogin } from '../utils/validators';
import { incidentApi } from '../services/incidentApi';

interface RangerLoginScreenProps {
  navigation: any;
  onLoginSuccess?: (user: any) => void;
}

export const RangerLoginScreen: React.FC<RangerLoginScreenProps> = ({
  navigation,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState('RN-402');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleLogin = async () => {
    setServerError(null);
    const validation = validateRangerLogin(identifier, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const user = await incidentApi.loginRanger(identifier, password);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
      navigation.replace('RangerMainTabs');
    } catch (err: any) {
      setServerError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
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
            <View style={styles.emblemBadge}>
              <Text style={styles.emblemIcon}>🛡️</Text>
            </View>
            <Text style={styles.brandTitle}>EcoGuard</Text>
            <Text style={styles.brandSub}>Field Conservation Operations</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ranger Login</Text>
            <Text style={styles.cardSubtitle}>
              Authenticate with your assigned Ranger ID or official email
            </Text>

            {serverError ? (
              <View style={styles.serverErrorBox}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            ) : null}

            <InputField
              label="Ranger ID or Email"
              placeholder="e.g. RN-402 or ranger@ecoguard.lk"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (errors.identifier) setErrors({ ...errors, identifier: '' });
              }}
              autoCapitalize="none"
              error={errors.identifier}
              required
            />

            <View style={styles.passwordContainer}>
              <InputField
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                secureTextEntry={!showPassword}
                error={errors.password}
                required
              />
              <TouchableOpacity
                style={styles.togglePasswordBtn}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.togglePasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton
              title="Access Ranger Console"
              onPress={handleLogin}
              loading={loading}
              icon="🧭"
              style={styles.loginButton}
            />

            <View style={styles.demoCredentialsBox}>
              <Text style={styles.demoTitle}>Field Quick Credentials:</Text>
              <Text style={styles.demoText}>ID: RN-402 • Password: password123</Text>
            </View>
          </View>

          <Text style={styles.footerNote}>
            EcoGuard Anti-Poaching System • UC01 Ranger Field Operations
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.primaryDark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  emblemBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.accent,
    marginBottom: THEME.spacing.md,
  },
  emblemIcon: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: THEME.typography.heading,
    fontWeight: '900',
    color: THEME.colors.textInverse,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: THEME.typography.sm,
    color: THEME.colors.accentLight,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: THEME.typography.xl,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    marginBottom: THEME.spacing.lg,
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: THEME.colors.error,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  errorIcon: {
    fontSize: 16,
    color: THEME.colors.error,
    marginRight: THEME.spacing.sm,
  },
  serverErrorText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.error,
    fontWeight: '600',
    flex: 1,
  },
  passwordContainer: {
    position: 'relative',
  },
  togglePasswordBtn: {
    position: 'absolute',
    right: 12,
    top: 36,
    padding: 6,
  },
  togglePasswordText: {
    fontSize: THEME.typography.xs,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  loginButton: {
    marginTop: THEME.spacing.sm,
  },
  demoCredentialsBox: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.sm,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.base,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  demoText: {
    fontSize: 12,
    color: THEME.colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  footerNote: {
    textAlign: 'center',
    color: '#8BA695',
    fontSize: 11,
    marginTop: THEME.spacing.xl,
    fontWeight: '500',
  },
});

export default RangerLoginScreen;

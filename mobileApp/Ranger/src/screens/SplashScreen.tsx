import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/authService';

interface SplashScreenProps {
  navigation: any;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const [isInitializing, setIsInitializing] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: Platform.OS !== 'web',
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Initialization delay
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, pulseAnim]);

  const handleGetStarted = async () => {
    setIsInitializing(true);
    const hasAuth = await authService.loadStoredAuth();
    if (hasAuth && authService.userRole) {
      const normalizedRole = authService.userRole
        ?.trim()
        .toUpperCase()
        .replace(/\s+/g, '_');

      switch (normalizedRole) {
        case 'COMMUNITY_LIAISON_OFFICER':
          navigation.replace('ConflictOperationsHome');
          break;
        case 'COMMUNITY_MEMBER':
          navigation.replace('CommunityMemberDashboard');
          break;
        case 'RANGER':
          navigation.replace('RangerMainTabs');
          break;
        case 'PARK_MANAGER':
        default:
          await authService.logout();
          navigation.replace('Login');
          break;
      }
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2016" />

      {/* Background Graphic Rings */}
      <View style={styles.bgGlowRing1} />
      <View style={styles.bgGlowRing2} />
      <View style={styles.bgGlowRing3} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Top Header Badge */}
        <View style={styles.topHeaderRow}>
          <View style={styles.telemetryBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.telemetryText}>ECOGUARD TELEMETRY</Text>
          </View>
          <Text style={styles.versionText}>v2.4 • SECTOR LIVE</Text>
        </View>

        {/* Center Hero Section */}
        <View style={styles.heroCenter}>
          <Animated.View
            style={[styles.logoGlowWrapper, { transform: [{ scale: pulseAnim }] }]}
          >
            <View style={styles.logoRingOuter}>
              <View style={styles.logoRingInner}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Animated.View>

          {/* WildGuard Brand Pill */}
          <View style={styles.brandPill}>
            <Text style={styles.brandPillIcon}>🛡️</Text>
            <Text style={styles.brandPillText}>WILDGUARD OPS COMMAND</Text>
          </View>

          {/* Title */}
          <Text style={styles.mainTitle}>
            Wildlife Conservation &{'\n'}Field Operations
          </Text>

          {/* Subtitle Tagline */}
          <Text style={styles.tagline}>
            “Protect. Respond. Conserve.”
          </Text>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardIcon}>🌐</Text>
            <Text style={styles.infoCardText}>
              Official Field Liaison & Rapid Emergency Dispatch System
            </Text>
          </View>
        </View>

        {/* Bottom Actions Area */}
        <View style={styles.bottomSection}>
          <View style={styles.statusIndicatorRow}>
            {isInitializing ? (
              <>
                <ActivityIndicator size="small" color="#A7F3D0" style={{ marginRight: 8 }} />
                <Text style={styles.statusText}>Connecting to EcoGuard Field Grid…</Text>
              </>
            ) : (
              <>
                <View style={styles.readyDot} />
                <Text style={styles.statusTextReady}>Encrypted Field Channel Ready</Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isInitializing && styles.primaryButtonDisabled]}
            onPress={handleGetStarted}
            disabled={isInitializing}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>GET STARTED / SIGN IN</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </TouchableOpacity>

          {/* Security Footer */}
          <View style={styles.securityFooter}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Community Members • Liaison Officers • Ranger Force
            </Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B2016',
    overflow: 'hidden',
  },

  // Concentric background rings with dark emerald tint
  bgGlowRing1: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.08)',
    backgroundColor: 'rgba(27, 67, 50, 0.2)',
  },
  bgGlowRing2: {
    position: 'absolute',
    top: height * 0.15,
    left: -width * 0.4,
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: (width * 1.6) / 2,
    borderWidth: 1,
    borderColor: 'rgba(82, 183, 136, 0.05)',
  },
  bgGlowRing3: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.3,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: (width * 1.4) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  // Top Header Row
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  telemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.2)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  telemetryText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  versionText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Center Hero
  heroCenter: {
    alignItems: 'center',
    marginVertical: 'auto',
  },
  logoGlowWrapper: {
    marginBottom: 24,
  },
  logoRingOuter: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: 'rgba(27, 67, 50, 0.5)',
    borderWidth: 2,
    borderColor: 'rgba(167, 243, 208, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#52B788',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoRingInner: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#1B4332',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 120,
    height: 120,
  },

  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  brandPillIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  brandPillText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#A7F3D0',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    maxWidth: width - 48,
  },
  infoCardIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  infoCardText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  // Bottom Section
  bottomSection: {
    width: '100%',
    alignItems: 'stretch',
    marginTop: 16,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    height: 24,
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextReady: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '700',
  },

  primaryButton: {
    backgroundColor: '#1B4332',
    borderColor: '#52B788',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonDisabled: {
    backgroundColor: '#0F261B',
    borderColor: '#374151',
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginRight: 8,
  },
  buttonArrow: {
    color: '#A7F3D0',
    fontSize: 18,
    fontWeight: '900',
  },

  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityIcon: {
    fontSize: 11,
    marginRight: 6,
  },
  securityText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SplashScreen;

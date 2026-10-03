import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { authService } from '../services/authService';

interface SplashScreenProps {
  navigation: any;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: Platform.OS !== 'web',
      easing: Easing.out(Easing.cubic),
    }).start();

    // Simulate an initialization delay
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  const handleGetStarted = async () => {
    setIsInitializing(true);
    const hasAuth = await authService.loadStoredAuth();
    if (hasAuth && authService.userRole) {
      if (authService.userRole === 'Community Liaison Officer') {
        navigation.replace('ConflictOperationsHome');
      } else if (authService.userRole === 'Ranger') {
        navigation.replace('RangerMainTabs');
      } else if (authService.userRole === 'Park Manager') {
        navigation.replace('RangerMainTabs');
      } else {
        navigation.replace('Login');
      }
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Graphic Elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.secureBadge}>
            <View style={styles.secureDot} />
            <Text style={styles.secureText}>SECURE LINK</Text>
          </View>
          <Text style={styles.gridText}>GRID 44-NORTH</Text>
        </View>

        {/* Center Logo Area */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>

        <View style={styles.wildguardBadge}>
          <Text style={styles.wildguardIcon}>🛡</Text>
          <Text style={styles.wildguardText}>WILDGUARD</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Wildlife Conservation &{'\n'}Field Operations
        </Text>

        {/* Subtitle / Quote */}
        <Text style={styles.quote}>
          “Protect. Respond. Conserve.”
        </Text>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxIcon}>🛡</Text>
          <Text style={styles.infoBoxText}>
            Official Wildlife Liaison & Field Dispatch System • v2.4
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Bottom Actions Area */}
        <View style={styles.bottomArea}>
          {isInitializing ? (
            <View style={styles.initializingContainer}>
              <ActivityIndicator size="small" color="#52B788" />
              <Text style={styles.initializingText}>
                Initializing Field Encrypted Session...
              </Text>
            </View>
          ) : (
            <View style={styles.initializingContainer}>
              <Text style={styles.initializingText}>
                Secure Session Ready
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isInitializing && styles.buttonDisabled]}
            onPress={handleGetStarted}
            disabled={isInitializing}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started / Sign In</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerIcon}>🔒</Text>
            <Text style={styles.footerText}>
              Authorized Personnel • Tier 4 Ranger Dispatch Grid
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
    backgroundColor: '#0F261B', // Dark greenish background mimicking the design
    overflow: 'hidden',
  },
  // Concentric circle background effects
  bgCircle1: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    width: width,
    height: width,
    borderRadius: width / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bgCircle2: {
    position: 'absolute',
    top: -height * 0.05,
    right: -width * 0.35,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  bgCircle3: {
    position: 'absolute',
    top: height * 0.05,
    right: -width * 0.5,
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#52B788',
    marginRight: 8,
  },
  secureText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gridText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#52B788',
    // Add shadow to match the previous aesthetic
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  wildguardBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#78350F',
    backgroundColor: 'rgba(120, 53, 15, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 32,
  },
  wildguardIcon: {
    color: '#F59E0B',
    fontSize: 12,
    marginRight: 6,
  },
  wildguardText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Serif font for elegance
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#A7F3D0', // Light green tint
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    alignSelf: 'stretch',
  },
  infoBoxIcon: {
    fontSize: 16,
    color: '#52B788',
    marginRight: 12,
  },
  infoBoxText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  spacer: {
    flex: 1,
  },
  bottomArea: {
    alignItems: 'stretch',
  },
  initializingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    height: 24, // Keep height consistent
  },
  initializingText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#2D6A4F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#1B4332',
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonArrow: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerIcon: {
    fontSize: 10,
    marginRight: 6,
    color: '#6B7280',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default SplashScreen;

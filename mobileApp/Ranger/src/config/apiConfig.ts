import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically resolves the backend API base URL depending on the current platform & environment.
 * - Web Browser: http://localhost:5000
 * - Expo Go (Physical Device): http://<PC_LAN_IP>:5000
 * - Android Emulator: http://10.0.2.2:5000
 * - Manual Environment Override: process.env.EXPO_PUBLIC_API_URL
 */
export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Running on Web browser
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  // Try extracting IP from Metro / Expo bundler hostUri (e.g., 192.168.x.x:8081 -> 192.168.x.x)
  const hostUri = Constants.expoConfig?.hostUri || (Constants.manifest as any)?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000`;
    }
  }

  // Android Emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  // Default LAN fallback
  return 'http://192.168.8.200:5000';
};

export const API_BASE_URL = getApiBaseUrl();
console.log(`[API Config] Resolved backend base URL: ${API_BASE_URL} (Platform: ${Platform.OS})`);
export default API_BASE_URL;

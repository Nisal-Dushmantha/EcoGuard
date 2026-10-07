// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
      return Promise.resolve(null);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve(null);
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve(null);
    }),
  };
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => {
  const listeners = [];
  return {
    addEventListener: jest.fn((cb) => {
      listeners.push(cb);
      return jest.fn();
    }),
    fetch: jest.fn(() =>
      Promise.resolve({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      })
    ),
  };
});

// Mock React Native primitives
jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'android',
      select: (obj) => obj.android || obj.default,
    },
    StyleSheet: {
      create: (styles) => styles,
    },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    SafeAreaView: 'SafeAreaView',
    Modal: 'Modal',
    TextInput: 'TextInput',
    ActivityIndicator: 'ActivityIndicator',
    Alert: {
      alert: jest.fn(),
    },
    StatusBar: () => null,
    RefreshControl: 'RefreshControl',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
  };
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file:///data/user/0/ecoguard/cache/test_evidence.jpg', fileName: 'test_evidence.jpg', fileSize: 2048, mimeType: 'image/jpeg' }],
    })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file:///data/user/0/ecoguard/cache/test_gallery.jpg', fileName: 'test_gallery.jpg', fileSize: 2048, mimeType: 'image/jpeg' }],
    })
  ),
  MediaTypeOptions: {
    Images: 'images',
    Videos: 'videos',
    All: 'all',
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system/legacy', () => ({
  uploadAsync: jest.fn(() =>
    Promise.resolve({
      status: 200,
      body: JSON.stringify({
        success: true,
        data: { photoUrl: 'https://example.com/mock_evidence.jpg' },
      }),
    })
  ),
  FileSystemUploadType: {
    MULTIPART: 'multipart',
  },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {},
  },
}));

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

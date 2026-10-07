import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

class AuthService {
  private client: AxiosInstance;
  private authToken: string | null = null;
  public userRole: string | null = null;
  public userName: string | null = null;
  public userId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  public async setAuthToken(token: string | null, role?: string | null, name?: string | null, id?: string | null) {
    this.authToken = token;
    this.userRole = role || null;
    this.userName = name || null;
    this.userId = id || null;
    try {
      if (token) {
        await AsyncStorage.setItem('@ecoguard_auth_token_v1', token);
        if (role) await AsyncStorage.setItem('@ecoguard_auth_role_v1', role);
        if (name) await AsyncStorage.setItem('@ecoguard_auth_name_v1', name);
        if (id) await AsyncStorage.setItem('@ecoguard_auth_user_id_v1', id);
      } else {
        await AsyncStorage.removeItem('@ecoguard_auth_token_v1');
        await AsyncStorage.removeItem('@ecoguard_auth_role_v1');
        await AsyncStorage.removeItem('@ecoguard_auth_name_v1');
        await AsyncStorage.removeItem('@ecoguard_auth_user_id_v1');
      }
    } catch (e) {
      console.error('Failed to save auth state to AsyncStorage', e);
    }
  }

  public async loadStoredAuth() {
    try {
      const token = await AsyncStorage.getItem('@ecoguard_auth_token_v1');
      const role = await AsyncStorage.getItem('@ecoguard_auth_role_v1');
      const name = await AsyncStorage.getItem('@ecoguard_auth_name_v1');
      const id = await AsyncStorage.getItem('@ecoguard_auth_user_id_v1');
      if (token) {
        this.authToken = token;
        this.userRole = role;
        this.userName = name;
        this.userId = id;
        return true;
      }
    } catch (e) {
      console.error('Failed to load auth from AsyncStorage', e);
    }
    return false;
  }

  public async logout() {
    await this.setAuthToken(null, null, null, null);
  }

  public setBaseURL(url: string) {
    this.client.defaults.baseURL = url;
  }

  /**
   * Log in user against the shared webapp authentication API
   */
  async login(credentials: { email: string; password: string }): Promise<any> {
    try {
      const response = await this.client.post('/api/webapp/auth/login', credentials);
      const data = response.data;
      if (data.token) {
        const uid = data.user?.id || data.user?._id;
        await this.setAuthToken(data.token, data.user?.role, data.user?.name, uid);
      }
      return data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.error || err.message || 'Login failed');
    }
  }

  /**
   * Register a new user against the shared webapp authentication API
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    assignedPark?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/webapp/auth/register', userData);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.error || err.message || 'Registration failed');
    }
  }

  /**
   * Get current authenticated user details
   */
  async getMe(): Promise<any> {
    try {
      const response = await this.client.get('/api/webapp/auth/me');
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.error || err.message || 'Failed to fetch profile');
    }
  }

  /**
   * Update user-editable profile details
   */
  async updateProfile(updates: { name?: string; phoneNumber?: string; dutyStatus?: boolean; callSign?: string }): Promise<any> {
    try {
      const response = await this.client.patch('/api/webapp/auth/me', updates);
      if (response.data?.user?.name) {
        this.userName = response.data.user.name;
        await AsyncStorage.setItem('@ecoguard_auth_name_v1', response.data.user.name);
      }
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.error || err.message || 'Failed to update profile');
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
    try {
      const response = await this.client.post('/api/webapp/auth/change-password', data);
      return response.data;
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.error || err.message || 'Failed to change password');
    }
  }

  /**
   * Check if backend server is reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await this.client.get('/api/health', { timeout: 3000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;

import type { AuthResponse, User, UserRole } from '../types/auth';

// Use relative URL so Vite proxy forwards /api to backend port 5000 without CORS or port issues
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/webapp';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('ecoguard_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }
      return data as T;
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the backend server. Please ensure the backend is running on port 5000 (cd backend; npm run dev).');
      }
      throw err;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }
      return data as T;
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the backend server. Please ensure the backend is running on port 5000 (cd backend; npm run dev).');
      }
      throw err;
    }
  }

  async checkHealth(): Promise<{ status: string; online: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        return { status: data.status || 'ok', online: true };
      }
      return { status: 'error', online: false };
    } catch {
      return { status: 'offline', online: false };
    }
  }
}

export const api = new ApiService();

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    assignedPark?: string;
  }): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register', userData);
  },

  getMe: async (): Promise<{ user: User }> => {
    return api.get<{ user: User }>('/auth/me');
  },

  checkHealth: async () => {
    return api.checkHealth();
  },
};

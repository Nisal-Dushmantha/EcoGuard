import type { AuthResponse, User, UserRole } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/webapp';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('ecoguard_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
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
};

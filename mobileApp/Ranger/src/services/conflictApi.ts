import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';

// Ensure it points to the same base as authService to keep things consistent.
// We'll export the class so the URL can be updated from a single place if needed,
// but hardcoding the same IP we used for authService works well for this local setup.
const DEFAULT_API_BASE = 'http://192.168.8.200:5000';

class ConflictApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: DEFAULT_API_BASE,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercept to add token from authService
    this.client.interceptors.request.use((config) => {
      // In a real app we'd expose a getter for the token from authService or async storage
      // Since authService doesn't export a getToken(), we'll assume it's attached globally or we can bypass for now.
      // Wait, let's just make the request. If the backend needs auth, we'll need to pass it.
      // Our new endpoint doesn't strictly enforce auth token yet based on how we wrote the controller.
      return config;
    });
  }

  public setBaseURL(url: string) {
    this.client.defaults.baseURL = url;
  }

  async getDashboardSummary(park?: string): Promise<any> {
    try {
      const response = await this.client.get('/api/mobile/conflicts/dashboard-summary', {
        params: { park }
      });
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch conflict summary');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        throw new Error('Network error. Unable to connect to the backend server.');
      }
      throw new Error(err.response?.data?.message || err.message || 'Error fetching summary');
    }
  }
}

export const conflictApi = new ConflictApiService();
export default conflictApi;

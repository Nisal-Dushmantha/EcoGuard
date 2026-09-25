export type UserRole = 'Park Manager' | 'Conservation Researcher' | 'Ranger' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedPark: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

import { create } from 'zustand';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'merchant';
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from localStorage
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('user_data');
  let user: User | null = null;
  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error('Failed to parse user data from localStorage', e);
  }

  return {
    token,
    user,
    isAuthenticated: !!token,
    setAuth: (token, user) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },
    clearAuth: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});

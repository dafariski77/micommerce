export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'merchant';
}

export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('auth_token');

export const getUser = (): User | null => {
  const user = localStorage.getItem('user_data');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user: User) => localStorage.setItem('user_data', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user_data');

export const logout = () => {
  removeAuthToken();
  removeUser();
  window.location.href = '/login';
};

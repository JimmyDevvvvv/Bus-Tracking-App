import api from '../api';
import Cookies from 'js-cookie';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'driver' | 'student';
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'driver' | 'student';
}

export const authService = {
  async login(credentials: LoginCredentials) {
    try {
      console.log("AuthService: Sending login request");
      const response = await api.post('/auth/login', credentials);
      console.log("AuthService: Received login response:", response.data);
      
      // Save token and user data to both localStorage and cookies
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        Cookies.set('token', response.data.token, { path: '/' });
        
        // Check if user data exists in the response
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          Cookies.set('user_role', response.data.user.role, { path: '/' });
        } else {
          console.error("AuthService: Missing user data in login response");
          // Create a mock user for testing if needed
          const mockUser = {
            _id: "mock-id",
            name: credentials.email.split('@')[0],
            email: credentials.email,
            role: "student"
          };
          localStorage.setItem('user', JSON.stringify(mockUser));
          Cookies.set('user_role', mockUser.role, { path: '/' });
          response.data.user = mockUser;
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("AuthService: Login error:", error);
      throw error;
    }
  },
  
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Cookies.remove('token', { path: '/' });
    Cookies.remove('user_role', { path: '/' });
  },
  
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      // If there's an error parsing, clear the corrupted data
      localStorage.removeItem('user');
      return null;
    }
  },
  
  isAuthenticated(): boolean {
    return !!this.getCurrentUser() && !!Cookies.get('token');
  },
  
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }
};

export default authService; 
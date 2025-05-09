import { useRouter } from 'next/navigation';

// --- Constants ---
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
const TOKEN_KEY = 'token';
const LAST_ACTIVE_KEY = 'lastActive';

// Debug log for API URL (client-side only)
if (typeof window !== 'undefined') {
  console.log('API URL being used:', API_URL);
}

// --- Types ---
export interface LoginCredentials {
  email: string;
  password: string;
  otp?: string; // Optional: For two-factor authentication
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string; // Optional: Default role might be set by backend
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string; // Present on successful login
  error?: string; // Present on failure
}

// Represents the user data decoded from the JWT token
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// --- Utility Functions ---

/**
 * Checks if the code is running on the client-side.
 * @returns {boolean} True if running in a browser environment, false otherwise.
 */
export const isClient = (): boolean => typeof window !== 'undefined';

/**
 * Safely interacts with localStorage.
 * @param action - The action to perform ('get', 'set', 'remove').
 * @param key - The localStorage key.
 * @param value - The value to set (only for 'set' action).
 * @returns The retrieved value (for 'get'), or void.
 */
const safeLocalStorage = (
  action: 'get' | 'set' | 'remove',
  key: string,
  value?: string | null
): string | null | void => {
  if (!isClient()) {
    // Avoid localStorage access during server-side rendering or build
    if (action === 'get') return null;
    return;
  }
  try {
    if (action === 'get') {
      return localStorage.getItem(key);
    } else if (action === 'set' && value !== undefined && value !== null) {
      localStorage.setItem(key, value);
    } else if (action === 'remove') {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`LocalStorage Error (${action} ${key}):`, error);
    // Gracefully handle storage errors (e.g., storage full, security restrictions)
    if (action === 'get') return null;
  }
};

// --- Token Management ---

/**
 * Retrieves the authentication token from localStorage.
 * @returns {string | null} The token or null if not found or error.
 */
export const getToken = (): string | null => {
  return safeLocalStorage('get', TOKEN_KEY) as string | null;
};

/**
 * Stores the authentication token in localStorage.
 * @param {string} token - The token to store.
 */
export const setToken = (token: string): void => {
  safeLocalStorage('set', TOKEN_KEY, token);
};

/**
 * Removes the authentication token from localStorage.
 */
export const removeToken = (): void => {
  safeLocalStorage('remove', TOKEN_KEY);
  safeLocalStorage('remove', LAST_ACTIVE_KEY); // Also clear last active timestamp on logout
};

/**
 * Updates the last active timestamp in localStorage.
 */
export const updateLastActive = (): void => {
  safeLocalStorage('set', LAST_ACTIVE_KEY, new Date().toISOString());
};

// --- Authentication Status ---

/**
 * Checks if a user token exists in localStorage.
 * @returns {boolean} True if a token exists, false otherwise.
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Parses the JWT token to extract user information.
 * Handles potential errors during parsing.
 * @returns {User | null} The decoded user information or null if token is invalid/missing.
 */
export const parseUserFromToken = (): User | null => {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      throw new Error('Invalid JWT token format: Missing payload.');
    }
    // Replace Base64 URL characters and decode
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);

    // Validate expected payload structure
    if (!payload.id || !payload.role) {
       console.warn('Parsed token payload is missing expected fields (id, role).', payload);
       // Depending on strictness, you might throw an error or return null here
    }

    // Return standardized User object with defaults
    return {
      id: payload.id,
      name: payload.name || 'User', // Default name if not present
      email: payload.email || '', // Default email if not present
      role: payload.role || 'student', // Default role if not present
    };
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    removeToken(); // If token is invalid, remove it
    return null;
  }
};

// --- API Functions ---

/**
 * Handles the user login request.
 * @param {LoginCredentials} credentials - User's email and password.
 * @returns {Promise<AuthResponse>} The result of the login attempt.
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data: AuthResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || data.error || `Login failed (HTTP ${response.status})`,
        error: data.error || data.message || 'Unknown login error',
      };
    }

    if (data.token) {
      setToken(data.token);
      updateLastActive(); // Update activity on successful login
    } else {
        // This case shouldn't happen if response.ok is true and backend is correct, but good to handle
        console.warn("Login successful but no token received.");
        return {
            success: false,
            message: "Login seemed successful but no token was provided by the server.",
            error: "Missing token in response",
        };
    }

    return {
      success: true,
      message: data.message || 'Login successful',
      token: data.token,
    };
  } catch (error: any) {
    console.error('Login API request error:', error);
    return {
      success: false,
      message: 'An network error occurred during login. Please try again.',
      error: error.message || 'Network error',
    };
  }
};

/**
 * Handles the user registration request.
 * @param {RegisterData} userData - User's registration details.
 * @returns {Promise<AuthResponse>} The result of the registration attempt.
 */
export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data: AuthResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || data.error || `Registration failed (HTTP ${response.status})`,
        error: data.error || data.message || 'Unknown registration error',
      };
    }

    // Registration typically doesn't return a token, just success/message
    return {
      success: true,
      message: data.message || 'Registration successful. Please log in.',
    };
  } catch (error: any) {
    console.error('Registration API request error:', error);
    return {
      success: false,
      message: 'An network error occurred during registration. Please try again.',
      error: error.message || 'Network error',
    };
  }
};

/**
 * Handles user logout, clearing local token and optionally notifying the backend.
 */
export const logout = async (): Promise<void> => {
  const token = getToken(); // Get token before removing it

  // Always remove local token regardless of API call success
  removeToken();

  if (token) {
    try {
      // Attempt to notify the backend about the logout
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
       console.log("Backend logout notification sent.");
    } catch (error) {
      // Log backend logout error but don't block the overall logout process
      console.warn('Optional: Backend logout API call failed:', error);
    }
  }
};

/**
 * Makes an authenticated API request using the stored token.
 * Throws an error if not authenticated or if the fetch fails.
 * @param {string} url - The relative API endpoint URL (e.g., '/users/profile').
 * @param {RequestInit} options - Standard fetch options (method, body, etc.).
 * @returns {Promise<Response>} The fetch Response object.
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();

  if (!token) {
    console.error('fetchWithAuth called without a token.');
    // Re-throwing allows calling components to handle the unauthenticated state
    throw new Error('Not authenticated');
  }

  // Update activity timestamp on authenticated requests
  updateLastActive();

  const headers = {
    // Ensure JSON content type unless specified otherwise
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers, // Allow overriding headers
    'Authorization': `Bearer ${token}`, // Add the Authorization header
  };

  // Prepend API base URL if the provided URL is relative
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url.startsWith('/') ? url : `/${url}`}`;

  console.log(`Fetching [${options.method || 'GET'}] from URL:`, fullUrl); // Log method too

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });
    // Note: We don't check response.ok here. The calling function should handle it.
    return response;
  } catch (error) {
    console.error(`Fetch error for ${fullUrl}:`, error);
    // Re-throw the error so the caller can handle network issues
    throw error;
  }
};

// --- React Hook for Auth ---

/**
 * Custom hook providing utility functions for handling authentication redirects in React components.
 */
export const useAuth = () => {
  const router = useRouter();

  /**
   * Checks if the user is authenticated. If not, redirects to the login page.
   * Should be called within useEffect or event handlers on the client-side.
   * @returns {boolean} True if authenticated, false if redirection initiated.
   */
  const requireAuth = (): boolean => {
    if (!isClient()) return false; // Don't run redirect logic on server

    if (!isAuthenticated()) {
      console.log('Authentication required, redirecting to login.');
      router.push('/login'); // Or your specific login route
      return false;
    }
    return true;
  };

  /**
   * Checks if the user is already authenticated. If so, redirects to the main dashboard/app page.
   * Useful for login/register pages to prevent access if already logged in.
   * Should be called within useEffect or event handlers on the client-side.
   * @returns {boolean} True if redirection initiated, false otherwise.
   */
  const redirectIfAuthenticated = (): boolean => {
     if (!isClient()) return false; // Don't run redirect logic on server

    if (isAuthenticated()) {
      console.log('User already authenticated, redirecting to dashboard.');
      router.push('/dashboard'); // Or your main authenticated route
      return true;
    }
    return false;
  };

  return { requireAuth, redirectIfAuthenticated };
}; 
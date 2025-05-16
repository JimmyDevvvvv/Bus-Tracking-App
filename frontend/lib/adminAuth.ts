import { useRouter } from 'next/navigation';
// Import necessary functions from the main auth module
import { 
    getToken, 
    parseUserFromToken, 
    fetchWithAuth, // Use the general fetchWithAuth for base functionality
    API_URL, // Use the central API_URL constant
    // isClient, // Use the central client check utility
    isAuthenticated // Use the general authentication check
} from './auth';

// Debug log
if (typeof window !== 'undefined') {
  console.log('Admin API URL being used:', API_URL);
}

// Utility to check if running on the client (browser)
const isClient = (): boolean => typeof window !== 'undefined';

// Types
export interface AdminResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  // Add other user fields as needed
}

// --- Admin-Specific Auth Checks ---

/**
 * Checks if the currently authenticated user has the 'admin' role.
 * Relies on the token being parsed correctly by parseUserFromToken.
 * @returns {boolean} True if the user is authenticated and has the admin role, false otherwise.
 */
export const isAdmin = (): boolean => {
  if (!isClient()) return false; // Cannot determine role server-side without context
  
  const user = parseUserFromToken();
  return !!user && user.role === 'admin';
};

// --- Admin API Requests ---

/**
 * Makes an authenticated API request specifically requiring admin privileges.
 * Wraps the general fetchWithAuth, adding an admin role check before proceeding.
 * Throws an error if not authenticated, not admin, or if the fetch fails.
 * @param {string} url - The relative API endpoint URL (e.g., '/admin/users').
 * @param {RequestInit} options - Standard fetch options (method, body, etc.).
 * @returns {Promise<Response>} The fetch Response object.
 */
export const fetchWithAdminAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
    // 1. Check basic authentication first
    const token = getToken();
    if (!token) {
      console.error('fetchWithAdminAuth called without a token.');
      throw new Error('Not authenticated');
    }

    // 2. Check if the user has the admin role
    if (!isAdmin()) {
      console.error('fetchWithAdminAuth called by non-admin user.');
      throw new Error('Forbidden: Admin privileges required');
    }

    // 3. Prepend the /admin path if the URL doesn't already include it
    // Assumes admin routes are consistently prefixed under /admin on the backend API
    const adminUrl = url.startsWith('/admin') ? url : `/admin${url}`;

    // 4. Use the general fetchWithAuth for the actual request
    // It handles adding the base API_URL and the Authorization header
    console.log(`Admin Fetch [${options.method || 'GET'}] to relative path:`, adminUrl);
    // No need to construct fullUrl here, fetchWithAuth does that
    return fetchWithAuth(adminUrl, options); 
    // fetchWithAuth will throw if the underlying fetch fails
};

// --- React Hook for Admin Auth ---

/**
 * Custom hook providing utility functions for handling admin authentication redirects.
 */
export const useAdminAuth = () => {
  const router = useRouter();

  /**
   * Checks if the user is an authenticated admin. If not, redirects to login.
   * Should be called within useEffect or event handlers on the client-side.
   * @returns {boolean} True if authenticated as admin, false if redirection initiated.
   */
  const requireAdminAuth = (): boolean => {
    if (!isClient()) return false; // Don't run redirect logic on server

    // Check both authentication and admin role
    if (!isAuthenticated()) {
      console.log('Admin authentication required, redirecting to login (not authenticated).');
      router.push('/login'); // Redirect to general login
      return false;
    }
    
    if (!isAdmin()) {
       console.log('Admin privileges required, redirecting to dashboard or login (not admin).');
       // Decide where to redirect non-admins (e.g., back to dashboard or login)
       router.push('/dashboard'); // Or maybe '/unauthorized' or back to '/login'
       return false;
    }

    return true; // User is authenticated and is an admin
  };

  // No need for redirectIfAdmin usually, as admin is just a role
  // If needed, it would be similar to redirectIfAuthenticated but check isAdmin()

  return { requireAdminAuth };
}; 
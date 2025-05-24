'use client'

import { useRouter } from 'next/navigation'

// --- Constants ---
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5002/api'
const TOKEN_KEY = 'token'
const LAST_ACTIVE_KEY = 'lastActive'

if (typeof window !== 'undefined') {
  console.log('API URL being used:', API_URL)
}

// --- Types ---
export interface LoginCredentials {
  email: string
  password: string
  otp?: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role?: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  token?: string
  error?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
}

// --- LocalStorage Utils ---
const safeLocalStorage = (
  action: 'get' | 'set' | 'remove',
  key: string,
  value?: string
): string | null | void => {
  if (typeof window === 'undefined') {
    if (action === 'get') return null
    return
  }
  try {
    if (action === 'get') {
      return localStorage.getItem(key)
    } else if (action === 'set' && value != null) {
      localStorage.setItem(key, value)
    } else if (action === 'remove') {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error(`LocalStorage Error (${action} ${key}):`, error)
    if (action === 'get') return null
  }
}

// --- Token Handling ---
export const getToken = (): string | null =>
  safeLocalStorage('get', TOKEN_KEY) as string | null

export const setToken = (token: string): void =>
  void safeLocalStorage('set', TOKEN_KEY, token)

export const removeToken = (): void => {
  void safeLocalStorage('remove', TOKEN_KEY)
  void safeLocalStorage('remove', LAST_ACTIVE_KEY)
}

export const updateLastActive = (): void =>
  void safeLocalStorage('set', LAST_ACTIVE_KEY, new Date().toISOString())

export const isAuthenticated = (): boolean => !!getToken()

export const parseUserFromToken = (): User | null => {
  const token = getToken()
  if (!token) return null
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    return {
      id: payload.id,
      name: payload.name || 'User',
      email: payload.email || '',
      role: payload.role || 'student',
    }
  } catch (error) {
    console.error('Error parsing JWT token:', error)
    removeToken()
    return null
  }
}

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

// --- REGISTER ---
export const register = async (
  userData: RegisterData
): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: defaultHeaders,
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'student',
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error:
          data.error ||
          data.message ||
          `Registration failed (${res.status})`,
      }
    }

    return {
      success: true,
      message: data.message || 'Registration successful. Please log in.',
    }
  } catch (err: any) {
    console.error('Registration API error:', err)
    return {
      success: false,
      error: err.message || 'Network error during registration',
    }
  }
}

// --- LOGIN ---
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: defaultHeaders,
      body: JSON.stringify(credentials),
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error:
          data.error || data.message || `Login failed (${res.status})`,
      }
    }

    if (data.token) {
      setToken(data.token)
      updateLastActive()
      return { success: true, token: data.token, message: data.message }
    } else {
      return { success: false, error: 'No token returned from server.' }
    }
  } catch (err: any) {
    console.error('Login API error:', err)
    return { success: false, error: err.message || 'Network error during login' }
  }
}

// --- LOGOUT ---
export const logout = async (): Promise<void> => {
  const token = getToken()
  removeToken()
  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          Authorization: `Bearer ${token}`,
          ...defaultHeaders,
        },
      })
    } catch (err) {
      console.warn('Backend logout error:', err)
    }
  }
}

// --- ENABLE MFA ---
export const enableMFA = async (): Promise<AuthResponse> => {
  const token = getToken()
  if (!token) {
    return { success: false, error: 'Not authenticated' }
  }
  try {
    const res = await fetch(`${API_URL}/auth/enable-mfa`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        Authorization: `Bearer ${token}`,
        ...defaultHeaders,
      },
    })
    const data = await res.json()
    if (!res.ok) {
      return {
        success: false,
        error: data.error || data.message || `Enable MFA failed (${res.status})`,
      }
    }
    return { success: true, message: data.message }
  } catch (err: any) {
    console.error('Enable MFA API error:', err)
    return { success: false, error: err.message || 'Network error during MFA enable' }
  }
}

// --- AUTHENTICATED FETCH ---
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')
  updateLastActive()
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as object),
  }
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`
  return fetch(fullUrl, { ...options, headers, mode: 'cors' })
}

// --- USE AUTH HOOK ---
export const useAuth = () => {
  const router = useRouter()

  const requireAuth = (): boolean => {
    if (!isAuthenticated()) {
      router.push('/login')
      return false
    }
    return true
  }

  const redirectIfAuthenticated = (): boolean => {
    if (isAuthenticated()) {
      router.push('/dashboard')
      return true
    }
    return false
  }

  return { requireAuth, redirectIfAuthenticated }
}

// --- PROFILE UPDATE ---
export async function updateProfile(data: {
  name?: string
  email?: string
  pickupLocation?: { address?: string }
  dropoffLocation?: { address?: string }
  profilePicture?: File
}): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    let res: Response

    if (data.profilePicture instanceof File) {
      const form = new FormData()
      form.append('profilePicture', data.profilePicture)
      if (data.name) form.append('name', data.name)
      if (data.email) form.append('email', data.email)
      if (data.pickupLocation)
        form.append('pickupLocation', JSON.stringify(data.pickupLocation))
      if (data.dropoffLocation)
        form.append('dropoffLocation', JSON.stringify(data.dropoffLocation))

      res = await fetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: form,
      })
    } else {
      res = await fetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    }

    const json = await res.json()
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Update failed' }
    }
    return { success: true, user: json.user }
  } catch (err: any) {
    console.error('updateProfile error', err)
    return { success: false, error: err.message || 'Network error' }
  }
}

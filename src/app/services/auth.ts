import type { AxiosRequestConfig } from 'axios'
import { postJSON, getJSON } from '@/app/lib/http'

export type SignInResponse = {
  user: {
    id: number | string
    email: string,
    fullName?: string,
    phone?: string,
    avatarUrl?: string,
  }
}

export type ProfileResponse = {
  id: string | number
  user: string | number
  displayName?: string
  dateOfBirth?: string
  gender?: string
  bio?: string
  address?: string
  provinceCode?: string
  wardCode?: string
}

export type RegisterPayload = {
  fullName: string
  email: string
  password: string
}

// Register
export async function register(data: RegisterPayload, config?: AxiosRequestConfig): Promise<SignInResponse> {
  return postJSON<SignInResponse, RegisterPayload>('/api/users', data, config)
}

// Sign in
export async function signIn(email: string, password: string, config?: AxiosRequestConfig): Promise<SignInResponse> {
  return postJSON<SignInResponse, { email: string; password: string }>(
    '/api/users/login',
    { email, password },
    config,
  )
}

// Sign out
export async function signOut(config?: AxiosRequestConfig): Promise<void> {
  await postJSON<unknown, Record<string, never>>('/api/users/logout', {}, config)
}

// Fetch current user's profile
export async function fetchMyProfile(config?: AxiosRequestConfig): Promise<ProfileResponse | null> {
  try {
    const response = await getJSON<{ profile: ProfileResponse | null }>('/api/me/profile', config)
    return response.profile
  } catch {
    return null // Profile optional
  }
}

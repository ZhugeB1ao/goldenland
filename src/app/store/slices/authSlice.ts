import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as authService from '@/app/services/auth'
import { clearSearchHistory } from '@/app/(frontend)/(site)/home/lib/search/history'

export type UserState = {
  id?: string | number
  email?: string | null
  role?: 'admin' | 'user'
  fullName?: string | null
  phone?: string | null
  avatarUrl?: string | null
  activePackage?: string | number | { id?: string | number } | null
  active_package_id?: string | number | null
}

export type ProfileState = {
  id: string | number
  user: string | number
  displayName?: string
  dateOfBirth?: string
  gender?: string
  bio?: string
  address?: string
  provinceCode?: string
  wardCode?: string
} | null

type AuthState = {
  user: UserState | null
  profile: ProfileState
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
}

// Fetch profile after login/register
export const signInThunk = createAsyncThunk(
  'auth/signIn',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.signIn(credentials.email, credentials.password)
      // Fetch profile after successful sign in
      const profile = await authService.fetchMyProfile()
      return { user: response.user, profile }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Sign in failed')
    }
  },
)

// After registration, automatically sign in and fetch profile
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: authService.RegisterPayload, { rejectWithValue }) => {
    try {
      await authService.register(payload)
      const response = await authService.signIn(payload.email, payload.password)
      const profile = await authService.fetchMyProfile()
      return { user: response.user, profile }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Registration failed')
    }
  },
)

// Sign out and clear user/profile from state
export const signOutThunk = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    await authService.signOut()
    clearSearchHistory()
    return null
  } catch (err: any) {
    return rejectWithValue(err.message || 'Sign out failed')
  }
})

// Hydrate user & profile from server session
export const hydrateAuthThunk = createAsyncThunk(
  'auth/hydrate',
  async (user: UserState | null, { rejectWithValue }) => {
    if (!user) return { user: null, profile: null }

    try {
      const profile = await authService.fetchMyProfile()
      return { user, profile }
    } catch {
      // If profile fetch fails, still hydrate user (profile is optional)
      return { user, profile: null }
    }
  },
)

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signInThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signInThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.profile = action.payload.profile || null
      })
      .addCase(signInThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Register
      .addCase(registerThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.profile = action.payload.profile || null
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Sign Out
      .addCase(signOutThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signOutThunk.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.profile = null
      })
      .addCase(signOutThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Hydrate
      .addCase(hydrateAuthThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(hydrateAuthThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.profile = action.payload.profile
        state.error = null
      })
      .addCase(hydrateAuthThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export default authSlice.reducer

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectProfile = (state: { auth: AuthState }) => state.auth.profile
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectIsLoggedIn = (state: { auth: AuthState }) => Boolean(state.auth.user?.id)

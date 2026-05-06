// store/provider.tsx
'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from './index'
import {
  hydrateAuthThunk,
  selectAuthLoading,
  selectIsLoggedIn,
  UserState,
} from './slices/authSlice'
import {
  bootstrapFavoritesThunk,
  FAVORITES_STORAGE_KEY,
  prepareGuestFavoritesOnLoginThunk,
} from './slices/favoritesSlice'
import type { AppDispatch, RootState } from './index'

// ReduxInitializer Component
// This internal component handles the synchronization between the server-side session
// and the client-side Redux store. It also manages the initialization and merging
// of favorite properties.
function ReduxInitializer({ user }: { user: UserState | null }) {
  const dispatch = useDispatch<AppDispatch>()

  // Selectors to monitor auth state
  const isLoggedIn = useSelector((state: RootState) => selectIsLoggedIn(state as any))
  const authLoading = useSelector((state: RootState) => selectAuthLoading(state as any))

  // Refs to track status without triggering re-renders
  const hasBootstrappedFavoritesRef = useRef(false) // Ensures favorites are only bootstrapped once on mount
  const previousLoggedInRef = useRef(false) // Tracks login state changes (login/logout)
  const isMergingFavoritesRef = useRef(false) // Prevents multiple concurrent merge operations

  // Effect 1: Auth Hydration
  // Synchronizes the user data from the server (passed via props) into the Redux store.
  useEffect(() => {
    void dispatch(hydrateAuthThunk(user))
  }, [dispatch, user?.id])

  // Effect 2: Favorites Initialization and Synchronization
  // Handles bootstrapping favorites on start and merging guest favorites on login.
  useEffect(() => {
    // Wait until auth state is determined (hydration finished)
    if (authLoading) return

    // Step A: First time initialization (Bootstrap)
    if (!hasBootstrappedFavoritesRef.current) {
      void dispatch(bootstrapFavoritesThunk())
      hasBootstrappedFavoritesRef.current = true
      previousLoggedInRef.current = isLoggedIn
      return
    }

    // Step B: Handle Login Event
    // Detects transition from logged-out to logged-in
    if (!previousLoggedInRef.current && isLoggedIn && !isMergingFavoritesRef.current) {
      isMergingFavoritesRef.current = true
      // Prepare guest favorites for confirmation without saving to the server
      void dispatch(prepareGuestFavoritesOnLoginThunk()).finally(() => {
        isMergingFavoritesRef.current = false
      })
    }

    // Step C: Handle Logout Event
    // Detects transition from logged-in to logged-out
    if (previousLoggedInRef.current && !isLoggedIn) {
      // Re-bootstrap favorites (will load from localStorage as a guest)
      void dispatch(bootstrapFavoritesThunk())
    }

    // Update the ref to the current state for the next run
    previousLoggedInRef.current = isLoggedIn
  }, [authLoading, dispatch, isLoggedIn])

  // Effect 3: Multi-tab Synchronization
  // Listens for changes in localStorage from other tabs to keep guest favorites in sync.
  useEffect(() => {
    // Only relevant for guest users (logged-in users use server data)
    if (typeof window === 'undefined' || isLoggedIn) return

    const onStorage = (event: StorageEvent) => {
      if (event.key !== FAVORITES_STORAGE_KEY) return
      // Re-load favorites from localStorage if they changed in another tab
      void dispatch(bootstrapFavoritesThunk())
    }

    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [dispatch, isLoggedIn])

  return null
}

// ReduxProvider Component
// The main wrapper for the application that provides the Redux store.
// It also includes the ReduxInitializer to handle global state sync.
export default function ReduxProvider({
  children,
  user,
}: {
  children: ReactNode
  user?: UserState | null
}) {
  return (
    <Provider store={store}>
      {/* Initialize global state (Auth & Favorites) */}
      <ReduxInitializer user={user || null} />
      {children}
    </Provider>
  )
}

import { createAsyncThunk, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { signOutThunk } from './authSlice'
import {
  addFavorite,
  bulkMergeFavorites,
  fetchFavoritePropertyIds,
  removeFavorite,
} from '@/app/services/favorites'

// Key used for persisting favorites in local storage for guest users
export const FAVORITES_STORAGE_KEY = 'guest_favorite_property_ids'

type FavoritesState = {
  ids: number[]
  pendingIds: number[]
  loading: boolean
  error: string | null
}

const initialState: FavoritesState = {
  ids: [],
  pendingIds: [],
  loading: false,
  error: null,
}

type RollbackPayload = {
  propertyId: number
  previousWasFavorite: boolean
}


// Normalizes a property ID to an integer.
// Returns null if the value is not a valid positive integer.
const normalizePropertyId = (value: unknown): number | null => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

// Filters and returns unique favorite property IDs from a raw array.
const uniquePropertyIds = (rawIds: unknown[]): number[] => {
  const idSet = new Set<number>()

  for (const rawId of rawIds) {
    const propertyId = normalizePropertyId(rawId)
    if (!propertyId) continue
    idSet.add(propertyId)
  }

  return Array.from(idSet)
}

// Checks if a user is currently logged in based on the auth state.
const isLoggedIn = (state: any): boolean => Boolean(state?.auth?.user?.id)

// Reads guest favorite IDs from local storage.
const readGuestFavoriteIds = (): number[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)

    return uniquePropertyIds(Array.isArray(parsed) ? parsed : [])
  } catch {
    return []
  }
}


// Persists guest favorite IDs to local storage.
const persistGuestFavoriteIds = (ids: number[]): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(uniquePropertyIds(ids)))
}


// Clears guest favorite IDs from local storage.
const clearGuestFavoriteIds = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(FAVORITES_STORAGE_KEY)
}

// Removes a single favorite ID from guest storage.
const removeGuestFavoriteId = (propertyId: number): void => {
  const currentIds = readGuestFavoriteIds()
  const nextIds = currentIds.filter((id) => id !== propertyId)

  if (nextIds.length === 0) {
    clearGuestFavoriteIds()
    return
  }

  persistGuestFavoriteIds(nextIds)
}


// Fetches favorite property IDs for the authenticated user from the server.
export const fetchFavoritesThunk = createAsyncThunk<number[], void, { rejectValue: string }>(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchFavoritePropertyIds()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch favorites'
      return rejectWithValue(message)
    }
  },
)


// Initializes favorites on app start.
// Loads from local storage for guests or from the server for logged-in users.
export const bootstrapFavoritesThunk = createAsyncThunk<
  number[],
  void,
  { state: any; rejectValue: string }
>('favorites/bootstrap', async (_, { getState, rejectWithValue }) => {
  try {
    if (!isLoggedIn(getState())) {
      return readGuestFavoriteIds()
    }

    return await fetchFavoritePropertyIds()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to bootstrap favorites'
    return rejectWithValue(message)
  }
})

// Merges guest favorites from local storage into the user's account upon login.
export const mergeGuestFavoritesOnLoginThunk = createAsyncThunk<
  number[],
  void,
  { state: any; rejectValue: string }
>('favorites/mergeGuestOnLogin', async (_, { getState, rejectWithValue }) => {
  try {
    // If user is not logged in, return guest favorite IDs
    if (!isLoggedIn(getState())) {
      return readGuestFavoriteIds()
    }

    const guestFavoriteIds = readGuestFavoriteIds()

    if (guestFavoriteIds.length > 0) {
      const mergedIds = await bulkMergeFavorites(guestFavoriteIds)
      clearGuestFavoriteIds()
      return mergedIds
    }

    return await fetchFavoritePropertyIds()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync guest favorites'
    return rejectWithValue(message)
  }
})

// Prepares guest favorites on login without saving them to the server.
export const prepareGuestFavoritesOnLoginThunk = createAsyncThunk<
  { favorites: number[]; pending: number[] },
  void,
  { state: any; rejectValue: string }
>('favorites/prepareGuestOnLogin', async (_, { getState, rejectWithValue }) => {
  try {
    if (!isLoggedIn(getState())) {
      return { favorites: readGuestFavoriteIds(), pending: [] }
    }

    const guestFavoriteIds = readGuestFavoriteIds()
    const serverFavoriteIds = await fetchFavoritePropertyIds()

    const serverSet = new Set(serverFavoriteIds)
    const pending = guestFavoriteIds.filter((id) => !serverSet.has(id))
    const favorites = uniquePropertyIds(serverFavoriteIds)

    return { favorites, pending }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to prepare guest favorites'
    return rejectWithValue(message)
  }
})

// Resolves a pending favorite decision after login.
export const resolvePendingFavoriteThunk = createAsyncThunk<
  { propertyId: number; decision: 'save' | 'discard' },
  { propertyId: number; decision: 'save' | 'discard' },
  { state: any; rejectValue: string }
>('favorites/resolvePending', async ({ propertyId, decision }, { getState, rejectWithValue }) => {
  const normalizedId = normalizePropertyId(propertyId)

  if (!normalizedId) {
    return rejectWithValue('Invalid property id')
  }

  if (!isLoggedIn(getState())) {
    return rejectWithValue('User must be logged in to resolve favorites')
  }

  try {
    if (decision === 'save') {
      await addFavorite(normalizedId)
    }

    removeGuestFavoriteId(normalizedId)

    return { propertyId: normalizedId, decision }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to resolve favorite'
    return rejectWithValue(message)
  }
})


// Toggles a property as favorite.
// Handles local state updates immediately (optimistic update) and syncs with the server if logged in.
export const toggleFavoriteThunk = createAsyncThunk<
  { propertyId: number; previousWasFavorite: boolean },
  number | string,
  { state: any; rejectValue: string }
>('favorites/toggleFavorite', async (rawPropertyId, { dispatch, getState, rejectWithValue }) => {
  // 1. Normalize the property ID to ensure it's a valid integer
  const propertyId = normalizePropertyId(rawPropertyId)

  if (!propertyId) {
    return rejectWithValue('Invalid property id')
  }

  // 2. Capture the current state to know if we are adding or removing
  const previousState = getState() as any
  const previousWasFavorite = Boolean(previousState?.favorites?.ids?.includes(propertyId))

  // 3. Optimistic Update: Dispatch the local toggle action immediately
  // This updates the UI without waiting for the server response
  dispatch(toggleFavorite(propertyId))

  try {
    // 4. Handle Guest User (Not Logged In)
    if (!isLoggedIn(getState())) {
      // Get the updated list of IDs from the state after the local toggle
      const currentIds = (getState() as any)?.favorites?.ids || []
      // Save the updated list to localStorage
      persistGuestFavoriteIds(currentIds)

      return {
        propertyId,
        previousWasFavorite,
      }
    }

    // 5. Handle Authenticated User
    // Sync the change with the server via API
    if (previousWasFavorite) {
      // If it was already a favorite, call API to remove it
      await removeFavorite(propertyId)
    } else {
      // If it wasn't a favorite, call API to add it
      await addFavorite(propertyId)
    }

    return {
      propertyId,
      previousWasFavorite,
    }
  } catch (error: unknown) {
    // 6. Rollback: If the API call fails, revert the local state to its previous value
    dispatch(rollbackFavorite({ propertyId, previousWasFavorite }))

    const message = error instanceof Error ? error.message : 'Failed to toggle favorite'
    return rejectWithValue(message)
  }
})

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // Replaces the entire list of favorite IDs.
    setFavorites: (state, action: PayloadAction<number[]>) => {
      state.ids = uniquePropertyIds(action.payload)
      state.error = null
    },

    // Toggles a single property ID in the local state.
    toggleFavorite: (state, action: PayloadAction<number>) => {
      const propertyId = action.payload
      const index = state.ids.indexOf(propertyId)

      if (index >= 0) {
        state.ids.splice(index, 1)
      } else {
        state.ids.push(propertyId)
      }

      state.ids = uniquePropertyIds(state.ids)
    },

    // Reverts a favorite toggle operation if the server request fails.
    rollbackFavorite: (state, action: PayloadAction<RollbackPayload>) => {
      const { propertyId, previousWasFavorite } = action.payload
      const hasNow = state.ids.includes(propertyId)

      if (previousWasFavorite && !hasNow) {
        state.ids.push(propertyId)
      }

      if (!previousWasFavorite && hasNow) {
        state.ids = state.ids.filter((id) => id !== propertyId)
      }

      state.ids = uniquePropertyIds(state.ids)
    },

    // Replaces pending favorite IDs.
    setPendingFavorites: (state, action: PayloadAction<number[]>) => {
      state.pendingIds = uniquePropertyIds(action.payload)
    },

    // Removes a single favorite ID from the state list.
    removeFavoriteId: (state, action: PayloadAction<number>) => {
      state.ids = state.ids.filter((id) => id !== action.payload)
    },

     // Clears any existing error message from the state.
    clearFavoritesError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavoritesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFavoritesThunk.fulfilled, (state, action) => {
        state.loading = false
        state.ids = uniquePropertyIds(action.payload)
      })
      .addCase(fetchFavoritesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch favorites'
      })

      .addCase(bootstrapFavoritesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(bootstrapFavoritesThunk.fulfilled, (state, action) => {
        state.loading = false
        state.ids = uniquePropertyIds(action.payload)
      })
      .addCase(bootstrapFavoritesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to bootstrap favorites'
      })

      .addCase(mergeGuestFavoritesOnLoginThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(mergeGuestFavoritesOnLoginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.ids = uniquePropertyIds(action.payload)
      })

      .addCase(mergeGuestFavoritesOnLoginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to sync guest favorites'
      })
      .addCase(prepareGuestFavoritesOnLoginThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(prepareGuestFavoritesOnLoginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.ids = uniquePropertyIds(action.payload.favorites)
        state.pendingIds = uniquePropertyIds(action.payload.pending)
      })
      .addCase(prepareGuestFavoritesOnLoginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to prepare guest favorites'
      })
      .addCase(resolvePendingFavoriteThunk.fulfilled, (state, action) => {
        const { propertyId, decision } = action.payload

        state.pendingIds = state.pendingIds.filter((id) => id !== propertyId)

        if (decision === 'save') {
          if (!state.ids.includes(propertyId)) {
            state.ids.push(propertyId)
          }
          state.ids = uniquePropertyIds(state.ids)
        }

        if (decision === 'discard') {
          state.ids = state.ids.filter((id) => id !== propertyId)
        }
      })
      .addCase(resolvePendingFavoriteThunk.rejected, (state, action) => {
        state.error = action.payload || 'Failed to resolve favorite'
      })
      .addCase(toggleFavoriteThunk.pending, (state) => {
        state.error = null
      })
      .addCase(toggleFavoriteThunk.rejected, (state, action) => {
        state.error = action.payload || 'Failed to toggle favorite'
      })

      // Sign out
      .addCase(signOutThunk.fulfilled, (state) => {
        state.ids = []
        state.pendingIds = []
        clearGuestFavoriteIds()
      })
  },
})

export const {
  clearFavoritesError,
  rollbackFavorite,
  setFavorites,
  setPendingFavorites,
  removeFavoriteId,
  toggleFavorite,
} = favoritesSlice.actions

export default favoritesSlice.reducer

// Selects the array of favorite property IDs from the state.
export const selectFavoriteIds = (state: { favorites: FavoritesState }) => state.favorites.ids

// Selects pending favorite IDs that need confirmation after login.
export const selectPendingFavoriteIds = (state: { favorites: FavoritesState }) =>
  state.favorites.pendingIds

// Selects the loading status of favorite operations.
export const selectFavoritesLoading = (state: { favorites: FavoritesState }) => state.favorites.loading

// Selects any error message encountered during favorite operations.
export const selectFavoritesError = (state: { favorites: FavoritesState }) => state.favorites.error

// Creates a memoized selector that returns a Set of favorite property IDs for efficient lookups.
export const selectFavoriteIdSet = createSelector([selectFavoriteIds], (ids) => new Set(ids))

// Returns a selector to check if a specific property ID is in the favorites list.
export const selectIsFavorite = (propertyId: number | string) => (state: { favorites: FavoritesState }) => {
  const normalizedPropertyId = normalizePropertyId(propertyId)
  if (!normalizedPropertyId) return false

  return selectFavoriteIdSet(state).has(normalizedPropertyId)
}

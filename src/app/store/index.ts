// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import favoritesReducer from './slices/favoritesSlice'
import propertySearchReducer from './slices/propertySearchSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    favorites: favoritesReducer,
    propertySearch: propertySearchReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

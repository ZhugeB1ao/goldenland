import { SEARCH_HISTORY_STORAGE_KEY } from './constants'

// Safely access localStorage only in the browser.
const getHistoryStorage = (): Storage | undefined => {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

// Remove all stored search history.
export function clearSearchHistory(storage = getHistoryStorage()): void {
  if (!storage) return

  try {
    storage.removeItem(SEARCH_HISTORY_STORAGE_KEY)
  } catch {
    // Ignore storage failures. Search suggestions are non-critical UI state.
  }
}

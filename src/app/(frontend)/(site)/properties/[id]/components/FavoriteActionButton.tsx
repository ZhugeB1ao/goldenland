'use client'

import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/app/store'
import { selectFavoriteIdSet, toggleFavoriteThunk } from '@/app/store/slices/favoritesSlice'

type FavoriteActionButtonProps = {
  propertyId: number
  title: string
}

export function FavoriteActionButton({ propertyId, title }: FavoriteActionButtonProps) {
  const dispatch = useDispatch<AppDispatch>()
  const favoriteIdSet = useSelector((state: RootState) => selectFavoriteIdSet(state))
  const isFavorite = favoriteIdSet.has(propertyId)

  return (
    <button
      aria-label={`${isFavorite ? 'Bỏ khỏi' : 'Thêm vào'} danh sách yêu thích: ${title}`}
      className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center w-10 h-10"
      onClick={() => {
        void dispatch(toggleFavoriteThunk(propertyId))
      }}
      type="button"
    >
      <span
        className="material-symbols-outlined"
        style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
      >
        favorite
      </span>
    </button>
  )
}

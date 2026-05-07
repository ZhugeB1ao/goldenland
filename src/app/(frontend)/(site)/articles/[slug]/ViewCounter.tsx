'use client'

import { useEffect, useRef } from 'react'

export function ViewCounter({ articleId }: { articleId: string }) {
  const hasFetched = useRef(false)

  useEffect(() => {
    // Only fetch once per mount to prevent double-counting in strict mode
    if (!hasFetched.current) {
      hasFetched.current = true
      
      fetch(`/api/articles/${articleId}/view`, {
        method: 'POST',
      }).catch(console.error)
    }
  }, [articleId])

  return null
}

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import SideBar from './SideBar'
import PostFlowModal from '../management/components/PostFlowModal'

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isPostFlowOpen, setIsPostFlowOpen] = useState(false)
  const [openToken, setOpenToken] = useState(0)

  const openPostFlow = () => {
    setOpenToken((prev) => prev + 1)
    setIsPostFlowOpen(true)
  }

  useEffect(() => {
    if (pathname === '/account') {
      const timer = window.setTimeout(() => {
        setOpenToken((prev) => prev + 1)
        setIsPostFlowOpen(true)
      }, 0)

      return () => window.clearTimeout(timer)
    }
  }, [pathname])

  return (
    <div className="flex min-h-screen">
      <SideBar onCreatePostClick={openPostFlow} />
      <main className="flex-1 p-4">{children}</main>

      <PostFlowModal key={openToken} isOpen={isPostFlowOpen} onClose={() => setIsPostFlowOpen(false)} />
    </div>
  )
}

import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import ReduxProvider from './store/provider'

export default async function Providers({ children }: { children: React.ReactNode }) {
  let currentUser: {
    id?: number | string
    email?: string | null
    role?: 'admin' | 'user'
    fullName?: string | null
    phone?: string | null
    avatarUrl?: string | null
  } | null = null

  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers })

    currentUser = user
      ? {
          id: user.id,
          email: user.email,
          role: (user as { role?: 'admin' | 'user' }).role,
          fullName: (user as { fullName?: string | null }).fullName ?? null,
          phone: (user as { phone?: string | null }).phone ?? null,
          avatarUrl: (user as { avatar_id?: string | null }).avatar_id ?? null,
        }
      : null
  } catch {
    currentUser = null
  }

  return <ReduxProvider user={currentUser}>{children}</ReduxProvider>
}

import React from 'react'
import { headers as getHeaders } from 'next/headers.js' // Get request headers (cookies, auth info)
import { getPayload } from 'payload' // Create Payload instance to use its API

import config from '@/payload.config' // Payload configuration

import './styles.css'
import Footer from './components/Footer'
import Header from './components/Header'
import PendingFavoriteToast from './home/components/PendingFavoriteToast'
import ReduxProvider from './store/provider'

// SEO metadata for the app
export const metadata = {
  title: 'Golden Land - Bất động sản',
  description: 'Nền tảng bất động sản hàng đầu Việt Nam',
}

// Root layout (wraps the whole app)
export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  // Store current logged-in user
  let currentUser: {
    id?: number | string
    email?: string | null
    fullName?: string | null
    phone?: string | null
    avatarUrl?: string | null
  } | null = null

  try {
    // Get request headers (contains cookies, token)
    const headers = await getHeaders()

    // Initialize Payload with config
    const payload = await getPayload({ config: await config })

    // Authenticate user using headers
    const { user } = await payload.auth({ headers })

    // If user exists, extract needed fields
    currentUser = user
      ? {
          id: user.id,
          email: user.email,
          fullName: (user as { fullName?: string | null }).fullName ?? null,
          phone: (user as { phone?: string | null }).phone ?? null,
          avatarUrl: (user as { avatar_id?: string | null }).avatar_id ?? null,
        }
      : null
  } catch {
    // If error happens, set user to null
    currentUser = null
  }

  return (
    <html lang="vi" className="scrollbar-hide">
      <head>
        {/* Load Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Load Material Icons */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="bg-background text-on-surface font-body">
        <ReduxProvider user={currentUser}>
          {/* No user prop to Header anymore */}
          <Header />
          <PendingFavoriteToast />

          {/* Render page content */}
          <main>{children}</main>

          {/* Footer */}
          <Footer />
        </ReduxProvider>
      </body>
    </html>
  )
}

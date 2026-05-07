import React from 'react'
import Providers from './Providers'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}

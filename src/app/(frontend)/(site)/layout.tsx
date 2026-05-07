import React from 'react'
import Footer from './components/Footer'
import Header from './components/Header'
import PendingFavoriteToast from './home/components/PendingFavoriteToast'

// SEO metadata for the app
export const metadata = {
  title: 'Golden Land - Bất động sản',
  description: 'Nền tảng bất động sản hàng đầu Việt Nam',
}

export default async function SiteLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <>
      <Header />
      <PendingFavoriteToast />
      <main>{children}</main>
      <Footer />
    </>
  )
}

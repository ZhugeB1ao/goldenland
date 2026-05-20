import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import MembershipBanner from './components/MembershipBanner'
import PricingTable from './components/PricingTable'
import FAQSection from './components/FAQSection'
import BalanceSummary from './components/BalanceSummary'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gói Hội Viên | GoldenLand',
  description: 'Nâng cấp gói hội viên để nhận được nhiều ưu đãi và tiện ích',
}

export default async function MembershipPage() {
  const payload = await getPayload({ config: configPromise })

  // Fetch packages
  const { docs: packages } = await payload.find({
    collection: 'packages',
    where: {
      isActive: { equals: true },
    },
    sort: 'price', // Sort by price ascending
  })

  return (
    <main className="bg-gray-50 min-h-screen" style={{ marginTop: '65px' }}>
      <MembershipBanner />
      <div className="container mx-auto px-4 -mt-10 relative z-10 max-w-6xl">
        <BalanceSummary />
        <PricingTable packages={packages} />
        <FAQSection />
      </div>
    </main>
  )
}

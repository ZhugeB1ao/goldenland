'use client'
import React from 'react'
import PricingCard from './PricingCard'

export default function PricingTable({ packages }: { packages: any[] }) {
  if (!packages || packages.length === 0) {
    return <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">Chưa có gói hội viên nào được cấu hình.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <PricingCard key={pkg.id} pkg={pkg} />
      ))}
    </div>
  )
}

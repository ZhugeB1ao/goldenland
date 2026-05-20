'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function BalanceSummary() {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true

    const loadBalance = async () => {
      try {
        const res = await fetch('/api/my/dashboard')
        const data = await res.json()

        if (mounted && res.ok) {
          setBalance(Number(data.balance || 0))
        }
      } catch {
        if (mounted) setBalance(null)
      }
    }

    loadBalance()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-gray-500">So du tai khoan</p>
        <p className="text-2xl font-bold text-emerald-700">
          {balance === null ? 'Dang tai...' : `${balance.toLocaleString('vi-VN')} VND`}
        </p>
      </div>
      <Link
        href="/account/top-up"
        className="rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Nap tien
      </Link>
    </div>
  )
}

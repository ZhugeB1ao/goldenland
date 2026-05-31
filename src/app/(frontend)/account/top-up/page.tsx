'use client'

import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

type PaymentInfo = {
  amount: number
  checkoutUrl: string
  orderId: string
  orderCode: string
  providerOrderCode: number
  qrImageUrl: string
  status: string
}

export default function TopUpPage() {
  const [amount, setAmount] = useState<number | ''>('')
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  const loadBalance = async () => {
    try {
      const res = await fetch('/api/my/dashboard')
      const data = await res.json()
      console.log('TOPUP STATUS:', data)
      if (res.ok) {
        setBalance(Number(data.balance || 0))
      }
    } catch {
      setBalance(null)
    }
  }

  useEffect(() => {
    loadBalance()
  }, [])

  useEffect(() => {
    if (!paymentInfo || paymentInfo.status === 'paid') return

    const intervalId = window.setInterval(async () => {
      try {
        const res = await fetch(
          `/api/top-up-status/${paymentInfo.orderId}`,
          {
            cache: 'no-store',
          }
        )
        const data = await res.json()
        console.log('TOPUP STATUS:', data)
        if (!res.ok) return

        if (String(data.status).toLowerCase() === 'paid') {
          setPaymentInfo((current) => (current ? { ...current, status: 'paid' } : current))
          setStatusMessage('Thanh toan thanh cong. So du da duoc cong vao tai khoan.')
          loadBalance()
          window.clearInterval(intervalId)
        }
      } catch {
        // Keep polling; transient network errors should not interrupt the payment flow.
      }
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [paymentInfo])

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || amount < 10000) {
      alert('Vui long nhap so tien tu 10.000 VND tro len')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          paymentMethod: 'bank_transfer',
        }),
      })

      const data = await res.json()
      console.log('TOPUP STATUS:', data)

      if (!res.ok) throw new Error(data.error || 'Khong tao duoc link thanh toan')

      const qrImageUrl = data.qrCode ? await QRCode.toDataURL(data.qrCode, { margin: 1, width: 320 }) : ''

      setPaymentInfo({
        amount: data.amount,
        checkoutUrl: data.checkoutUrl,
        orderId: data.order,
        orderCode: data.orderCode,
        providerOrderCode: data.providerOrderCode,
        qrImageUrl,
        status: 'pending',
      })
      setStatusMessage('Dang cho thanh toan tu payOS...')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (paymentInfo) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl bg-white p-6 shadow-md">
        <h1 className="text-xl font-bold text-green-700">
          {paymentInfo.status === 'paid' ? 'Nap tien thanh cong' : 'Thanh toan QR ngan hang'}
        </h1>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
          So du hien tai:{' '}
          <strong>{balance === null ? 'Dang tai...' : `${balance.toLocaleString('vi-VN')} VND`}</strong>
        </div>

        <div className="space-y-2 rounded-lg bg-gray-100 p-4 text-sm">
          <p>
            Ma don: <strong>{paymentInfo.orderCode}</strong>
          </p>
          <p>
            Ma payOS: <strong>{paymentInfo.providerOrderCode}</strong>
          </p>
          <p>
            So tien:{' '}
            <strong className="text-red-600">{paymentInfo.amount.toLocaleString('vi-VN')} VND</strong>
          </p>
        </div>

        {paymentInfo.qrImageUrl ? (
          <div className="flex justify-center rounded-lg border bg-white p-4">
            <img src={paymentInfo.qrImageUrl} alt="Ma QR thanh toan payOS" className="h-64 w-64 object-contain" />
          </div>
        ) : null}

        <a
          href={paymentInfo.checkoutUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
        >
          Mo trang thanh toan payOS
        </a>

        <p className="text-xs text-gray-500">
          {statusMessage ||
            'Sau khi ban thanh toan thanh cong, payOS se goi webhook ve website va he thong se tu dong cong so du vao tai khoan.'}
        </p>

        <button
          type="button"
          onClick={() => {
            setPaymentInfo(null)
            setStatusMessage('')
          }}
          className="w-full rounded border px-4 py-2"
        >
          Tao yeu cau nap khac
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-md">
      <h1 className="mb-4 text-xl font-bold">Nap tien vao tai khoan</h1>

      <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
        So du hien tai:{' '}
        <strong>{balance === null ? 'Dang tai...' : `${balance.toLocaleString('vi-VN')} VND`}</strong>
      </div>

      <form onSubmit={handleTopUp} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">So tien muon nap (VND)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded border px-3 py-2"
            placeholder="VD: 100000"
            required
            min="10000"
          />
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
          Phuong thuc: QR ngan hang qua payOS
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Dang tao link thanh toan...' : 'Tao QR thanh toan'}
        </button>
      </form>
    </div>
  )
}

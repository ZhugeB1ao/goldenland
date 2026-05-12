'use client'
import { useState } from 'react'

export default function TopUpPage() {
  const [amount, setAmount] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [orderInfo, setOrderInfo] = useState<{ orderCode: string; amount: number } | null>(null)

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) return alert('Vui lòng nhập số tiền hợp lệ')

    setLoading(true)
    try {
      const res = await fetch('/api/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // Nếu thành công, lưu lại mã đơn hàng để hiển thị hướng dẫn CK
      setOrderInfo({
        orderCode: data.orderCode,
        amount: Number(amount),
      })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Nếu đã tạo đơn thành công -> Hiện thông tin chuyển khoản
  if (orderInfo) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
        <h2 className="text-xl font-bold text-green-600">Yêu cầu nạp tiền thành công!</h2>
        <p>Vui lòng chuyển khoản theo thông tin dưới đây để chúng tôi xử lý:</p>
        <div className="bg-gray-100 p-4 rounded text-sm space-y-2">
          <p>
            Ngân hàng: <strong>Vietcombank</strong>
          </p>
          <p>
            Số tài khoản: <strong>0123456789</strong>
          </p>
          <p>
            Tên người nhận: <strong>CTY BĐS GOLDEN LAND</strong>
          </p>
          <p>
            Số tiền:{' '}
            <strong className="text-red-500">{orderInfo.amount.toLocaleString()} VNĐ</strong>
          </p>
          <p>
            Nội dung CK: <strong>{orderInfo.orderCode}</strong>
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Hệ thống sẽ tự động cộng tiền vào tài khoản của bạn sau khi nhận được thanh toán. (Trong
          giai đoạn test, Admin có thể vào Payload CMS Orders để đổi trạng thái sang Paid).
        </p>
      </div>
    )
  }

  // Form nhập tiền lúc ban đầu
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-xl font-bold mb-4">Nạp tiền vào tài khoản</h1>
      <form onSubmit={handleTopUp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Số tiền muốn nạp (VNĐ)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
            placeholder="VD: 500000"
            required
            min="10000"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang tạo yêu cầu...' : 'Tạo yêu cầu nạp tiền'}
        </button>
      </form>
    </div>
  )
}

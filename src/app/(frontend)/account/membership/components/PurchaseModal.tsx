'use client'
import React, { useState, useEffect } from 'react' // Thêm useEffect vào đây
import { X, Tent, AlertTriangle, ChevronRight } from 'lucide-react'

// Hàm format tiền
const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + ' đ'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  pkg: any
  handleConfirmPurchase: () => void
  loading: boolean
}

export default function PurchaseModal({
  isOpen,
  onClose,
  pkg,
  handleConfirmPurchase,
  loading,
}: PurchaseModalProps) {
  // State lưu mốc thời gian đang chọn (1, 3, 6)
  const [selectedMonths, setSelectedMonths] = useState<number>(3)

  // Giả lập số dư user (bạn có thể lấy từ API /api/users/me thực tế)
  const [userBalance, setUserBalance] = useState<number>(0)
  // Tự động gọi API lấy thông tin user khi mở Modal
  useEffect(() => {
    if (isOpen) {
      fetch('/api/my/dashboard')
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.balance === 'number') {
            setUserBalance(data.balance)
          }
        })
        .catch((err) => console.error('Lỗi lấy thông tin user:', err))
    }
  }, [isOpen])
  // Dữ liệu mock 3 tùy chọn mốc thời gian
  const options = [
    { months: 1, price: 540000, originalPrice: 675000, discount: 20, savePerMonth: 135000 },
    { months: 3, price: 1500000, originalPrice: 2025000, discount: 26, savePerMonth: 175000 },
    { months: 6, price: 2800000, originalPrice: 4050000, discount: 31, savePerMonth: 208000 },
  ]

  const selectedOption = options.find((opt) => opt.months === selectedMonths) || options[1]
  const totalAmount = selectedOption.price
  const isEnoughBalance = userBalance >= totalAmount

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Nút Đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition"
        >
          <X size={20} />
        </button>

        {/* Header Thông tin gói */}
        <div className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
              <Tent size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{pkg.name || 'Hội viên Cơ bản'}</h2>
              <p className="text-sm text-gray-500">Từ 467.000 đ/tháng (khi mua 6 tháng)</p>
            </div>
          </div>
        </div>

        {/* Body Nội dung */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <p className="text-xs text-gray-500 mb-3 font-medium">Giá bên dưới chưa bao gồm 8% VAT</p>

          {/* Tùy chọn thời gian */}
          <div className="space-y-3 mb-6">
            {options.map((opt) => (
              <div
                key={opt.months}
                onClick={() => setSelectedMonths(opt.months)}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedMonths === opt.months
                    ? 'border-blue-400 bg-blue-50/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-gray-800">{opt.months} Tháng</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-500 font-medium">Giảm {opt.discount}%</span>
                    <span className="line-through text-gray-400 text-sm">
                      {formatMoney(opt.originalPrice)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-sm text-teal-600 font-medium">
                    Tiết kiệm {formatMoney(opt.savePerMonth)}/tháng
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatMoney(opt.price)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Cảnh báo số dư */}
          {!isEnoughBalance && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                <span className="text-sm text-yellow-800">
                  Tài Khoản Chính của bạn không đủ tiền thanh toán
                </span>
              </div>
              <a
                href="/account/top-up"
                className="bg-red-600 text-white text-xs px-3 py-1.5 rounded font-medium shrink-0 whitespace-nowrap text-center hover:bg-red-700"
              >
                Nạp tiền
              </a>
            </div>
          )}

          {/* Khuyến mãi & Ghi chú */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="p-3 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Khuyến mãi</span>
              <div className="flex items-center text-sm text-blue-600">
                Chọn khuyến mãi <ChevronRight size={16} />
              </div>
            </div>
            <div className="p-3 bg-gray-50 text-xs text-gray-600 space-y-1">
              <p>• Quyền lợi gói bắt đầu tính từ thời điểm thanh toán thành công.</p>
              <p>• Vui lòng kiểm tra kỹ thông tin trước khi thanh toán.</p>
            </div>
          </div>
        </div>

        {/* Footer Thanh toán */}
        <div className="p-4 border-t bg-white flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Tổng tiền:</p>
            <p className="text-xl font-bold text-red-600">{formatMoney(totalAmount)}</p>
          </div>

          <button
            onClick={handleConfirmPurchase}
            disabled={loading || !isEnoughBalance}
            className={`px-8 py-3 rounded-lg font-bold transition-all ${
              !isEnoughBalance
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Thanh Toán'}
          </button>
        </div>
      </div>
    </div>
  )
}

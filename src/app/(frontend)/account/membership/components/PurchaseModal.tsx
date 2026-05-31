'use client'
import React, { useState, useEffect } from 'react' // Thêm useEffect vào đây
import { X, Tent, AlertTriangle, ChevronRight } from 'lucide-react'

// Hàm format tiền
const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + ' đ'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  pkg: any
  handleConfirmPurchase: (months: number) => void
  promotionId?: string
  onPromotionIdChange?: (id: string) => void
  loading: boolean
}

export default function PurchaseModal({
  isOpen,
  onClose,
  pkg,
  handleConfirmPurchase,
  promotionId = '',
  onPromotionIdChange,
  loading,
}: PurchaseModalProps) {
  const [pricing, setPricing] = useState<any>(null)
  const [selectedPromotionId, setSelectedPromotionId] = useState(promotionId)
  // Lấy các tùy chọn thời gian từ package, nếu không có thì tạo tùy chọn mặc định từ root package
  const options = React.useMemo(() => {
    if (pkg?.durationOptions && pkg.durationOptions.length > 0) {
      return pkg.durationOptions
    }
    // Fallback nếu gói không có durationOptions
    const fallbackMonths = Math.round((pkg?.durationDays || 30) / 30) || 1
    const savings =
      pkg?.originalPrice && pkg.originalPrice > pkg.price ? pkg.originalPrice - pkg.price : 0
    const discount = pkg?.originalPrice ? Math.round((savings / pkg.originalPrice) * 100) : 0
    const savePerMonth = Math.round(savings / fallbackMonths)
    return [
      {
        months: fallbackMonths,
        price: pkg?.price || 0,
        originalPrice: pkg?.originalPrice || pkg?.price || 0,
        discount: discount,
        savePerMonth: savePerMonth,
      },
    ]
  }, [pkg])

  // State lưu mốc thời gian đang chọn
  const [selectedMonths, setSelectedMonths] = useState<number>(3)
  const [showConfirm, setShowConfirm] = useState(false)
  useEffect(() => {
    if (!pkg?.id) return

    fetch('/api/calculate-package-price', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        packageId: pkg.id,
        selectedMonths,
        promotionId: selectedPromotionId || undefined,
      }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Khong ap dung duoc ma khuyen mai')
        return data
      })
      .then((data) => {
        setPricing(data)
      })
      .catch((error) => {
        setPricing(null)
        if (selectedPromotionId) {
          alert(error.message)
          setSelectedPromotionId('')
          onPromotionIdChange?.('')
        } else {
          console.error(error)
        }
      })
  }, [pkg?.id, selectedMonths, selectedPromotionId, onPromotionIdChange])
  // Khởi tạo mốc tháng mặc định khi options thay đổi
  useEffect(() => {
    if (options && options.length > 0) {
      const hasThree = options.some((opt: any) => opt.months === 3)
      setSelectedMonths(hasThree ? 3 : options[0].months)
    }
  }, [options])

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

  const selectedOption = options.find((opt: any) => opt.months === selectedMonths) ||
    options[0] || { price: 0 }
  const originalPrice = selectedOption.originalPrice || selectedOption.price

  const discountAmount = pricing?.promotionDiscount || 0

  // const totalAmount =
  //   selectedOption.price
  const totalAmount = pricing?.totalAmount ?? selectedOption.price
  const isEnoughBalance = userBalance >= totalAmount
  const handlePromotionChange = (id: string) => {
    setSelectedPromotionId(id)
    onPromotionIdChange?.(id)
  }

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
            {options.map((opt: any) => (
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
                    {opt.discount > 0 && (
                      <span className="text-sm text-red-500 font-medium">Giảm {opt.discount}%</span>
                    )}
                    {opt.originalPrice && opt.originalPrice > opt.price && (
                      <span className="line-through text-gray-400 text-sm">
                        {formatMoney(opt.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-sm text-teal-600 font-medium">
                    {opt.savePerMonth > 0 && `Tiết kiệm ${formatMoney(opt.savePerMonth)}/tháng`}
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
            <div className="p-3 border-b">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Khuyến mãi</span>
                <div className="flex items-center text-sm text-blue-600">
                  Chọn mã <ChevronRight size={16} />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                    !selectedPromotionId
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="promotion"
                    value=""
                    checked={!selectedPromotionId}
                    onChange={() => handlePromotionChange('')}
                    className="mt-1"
                  />
                  <span className="font-medium text-gray-700">Không dùng khuyến mãi</span>
                </label>

                {(pricing?.availablePromotions || []).map((promotion: any) => (
                  <label
                    key={promotion.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                      String(selectedPromotionId) === String(promotion.id)
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="promotion"
                      value={promotion.id}
                      checked={String(selectedPromotionId) === String(promotion.id)}
                      onChange={() => handlePromotionChange(String(promotion.id))}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-gray-800">{promotion.name}</span>
                      <span className="block text-xs text-gray-500">
                        {promotion.code ? `${promotion.code} - ` : ''}
                        Giảm {formatMoney(promotion.discountAmount || 0)}
                      </span>
                    </span>
                  </label>
                ))}

                {pricing &&
                  (!pricing.availablePromotions || pricing.availablePromotions.length === 0) && (
                    <p className="text-sm text-gray-500">Chưa có khuyến mãi phù hợp cho gói này.</p>
                  )}
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
            {pricing?.appliedPromotion && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="text-sm font-semibold text-green-700">
                  🎉 {pricing.appliedPromotion.name}
                </div>

                <div className="text-xs text-green-600 mt-1">
                  Bạn tiết kiệm được {formatMoney(pricing.promotionDiscount || 0)}
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500">Tổng tiền:</p>
            <p className="text-xl font-bold text-red-600">{formatMoney(totalAmount)}</p>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
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

      {/* Modal Xác Nhận Thanh Toán */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-yellow-600" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận thanh toán</h3>
            <p className="text-gray-600 text-sm mb-6">
              Bạn có chắc chắn muốn thanh toán số tiền <strong className="text-red-600">{formatMoney(totalAmount)}</strong> cho gói <strong>{pkg.name || 'Hội viên'}</strong> không?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  handleConfirmPurchase(selectedMonths)
                }}
                className="flex-1 px-4 py-2 bg-pink-600 text-white font-medium hover:bg-pink-700 rounded-lg transition-colors shadow-sm"
                disabled={loading}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

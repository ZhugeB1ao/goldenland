'use client'
import React, { useState } from 'react'
import { Check, X, Ticket } from 'lucide-react'
import PurchaseModal from './PurchaseModal'
// Formatting helpers
const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
export default function PricingCard({ pkg }: { pkg: any }) {
  // 1. Thêm State để làm nút loading
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // BẠN GIỮ NGUYÊN PHẦN TÍNH TOÁN CỦA BẠN:
  let discountPercentage = 0
  let savings = 0
  if (pkg.originalPrice && pkg.originalPrice > pkg.price) {
    savings = pkg.originalPrice - pkg.price
    discountPercentage = Math.round((savings / pkg.originalPrice) * 100)
  }
  // 2. THÊM HÀM XỬ LÝ MUA GÓI VÀO ĐÂY:
  // Xóa hàm handlePurchase cũ đi và thay bằng hàm này:
  const handleConfirmPurchase = async () => {
    setLoading(true)
    try {
      // Gọi API mua như cũ
      const res = await fetch('/api/purchase-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error)
        return
      }
      alert('Mua gói thành công!')
      window.location.reload()
    } catch (error) {
      alert('Đã có lỗi xảy ra khi mua gói')
    } finally {
      setLoading(false)
      setIsModalOpen(false) // Đóng modal khi xong
    }
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden relative flex flex-col border-2 ${pkg.isBestSeller ? 'border-yellow-400' : 'border-transparent'}`}
    >
      {pkg.isBestSeller && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-b-md">
          Bán chạy nhất
        </div>
      )}

      <div className="p-6 pb-0 flex-grow">
        <div className="flex justify-between items-start mb-4 mt-2">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{pkg.name}</h3>
            {pkg.subtitle && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">{pkg.subtitle}</p>
            )}
          </div>
        </div>

        <div className="mt-4 mb-6">
          <div className="flex items-end gap-2">
            <span className="text-sm text-gray-500 mb-1">từ</span>
            <span className="text-2xl font-bold text-gray-900">{formatMoney(pkg.price)}</span>
            <span className="text-sm text-gray-500 mb-1">/tháng</span>
            {discountPercentage > 0 && (
              <span className="text-sm font-medium text-red-500 mb-1">
                (-{discountPercentage}%)
              </span>
            )}
          </div>

          {savings > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Tiết kiệm đến{' '}
              <span className="font-semibold text-teal-600">{formatMoney(savings)}</span> mỗi tháng
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setIsModalOpen(true)} // Mở modal
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition-colors text-sm"
          >
            Mua gói 1 tháng
          </button>
          <button
            onClick={() => setIsModalOpen(true)} // Mở modal
            className="border border-red-600 text-red-600 hover:bg-red-50 py-2 px-4 rounded font-medium transition-colors text-sm"
          >
            Mua ngay
          </button>
        </div>

        {/* Vouchers section */}
        {pkg.bonusVouchers && pkg.bonusVouchers.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-1">
              Gói voucher {pkg.durationDays} ngày
              <span className="text-gray-400 text-xs ml-1">ⓘ</span>
            </h4>
            <div className="space-y-3">
              {pkg.bonusVouchers.map((v: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="mt-0.5 text-red-500 shrink-0">
                    <Ticket size={16} />
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{v.quantity}</span> voucher giảm{' '}
                    <span className="font-medium">{formatMoney(v.discountValue)}</span> mỗi lần{' '}
                    {v.appliedFor === 'normal'
                      ? 'đăng Tin Thường'
                      : v.appliedFor === 'vip'
                        ? 'đăng Tin VIP'
                        : 'đăng tin'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features section */}
        {pkg.features && pkg.features.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-800 mb-3">Tiện ích</h4>
            <div className="space-y-2">
              {pkg.features.map((feat: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  {feat.isAvailable ? (
                    <Check size={16} className="text-red-500 shrink-0" />
                  ) : (
                    <X size={16} className="text-gray-300 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${feat.isAvailable ? 'text-gray-800' : 'text-gray-400'}`}
                  >
                    {feat.feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* ... Vouchers section ... */}

      <PurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pkg={pkg}
        handleConfirmPurchase={handleConfirmPurchase}
        loading={loading}
      />
    </div> // Đây là thẻ div đóng của PricingCard
  )
}

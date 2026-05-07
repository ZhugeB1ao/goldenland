import React from 'react'
import { CheckCircle2, Ticket, Settings } from 'lucide-react'

export default function MembershipBanner() {
  return (
    <div className="bg-[#9e1c22] text-white pt-16 pb-24 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">Gói Hội viên - Tiết kiệm đến 39%</h1>
        <div className="inline-block bg-white text-red-700 font-medium px-3 py-1 rounded-sm text-sm mb-8">
          <span className="bg-red-700 text-white px-2 py-0.5 rounded-sm mr-2 text-xs">MỚI</span>
          Ra mắt lựa chọn - Gói 1 tháng
        </div>
        
        <div className="space-y-3 mb-8 max-w-2xl text-gray-100">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            <p>Có nhiều lựa chọn phù hợp với ngân sách đăng tin, giúp tối ưu hiệu quả bán hàng</p>
          </div>
          <div className="flex items-start gap-2">
            <Ticket className="w-5 h-5 mt-0.5 shrink-0" />
            <p>Voucher giảm giá linh hoạt, phù hợp với nhiều lựa chọn đăng tin</p>
          </div>
          <div className="flex items-start gap-2">
            <Settings className="w-5 h-5 mt-0.5 shrink-0" />
            <p>Sử dụng các tính năng tiện ích nâng cao dành riêng cho Hội viên</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-300">Giá của các gói bên dưới chưa bao gồm 8% VAT.</p>
      </div>
      
      {/* Decorative background elements can go here */}
      <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
        {/* Placeholder for the building illustrations */}
      </div>
    </div>
  )
}

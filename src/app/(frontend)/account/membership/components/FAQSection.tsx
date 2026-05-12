'use client'
import React, { useState } from 'react'

const faqs = [
  {
    question: "Gói Hội viên cung cấp các quyền lợi hàng tháng như thế nào?",
    answer: "Gói Hội viên cung cấp các quyền lợi kéo dài 1 tháng (sau 30 ngày sẽ hết hạn). Bạn có thể nâng cấp, gia hạn gói bằng cách chọn mua thêm các chu kỳ."
  },
  {
    question: "Tôi có thể hủy gói Hội viên không?",
    answer: "Bạn không thể huỷ Gói sau khi đã thanh toán thành công. Tuy nhiên, bạn có thể ngừng gia hạn cho các tháng tiếp theo."
  },
  {
    question: "Voucher giảm giá có cộng dồn không?",
    answer: "Voucher của Gói Hội viên có hiệu lực theo chu kỳ 30 ngày và không cộng dồn sang chu kỳ tiếp theo."
  }
]

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div className="mt-16 bg-white p-6 md:p-8 rounded-xl shadow-sm mb-16">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h2>
        </div>
        <div className="md:w-2/3 space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-4">
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="flex w-full justify-between items-center text-left"
              >
                <span className={`font-medium ${openIdx === idx ? 'text-red-600' : 'text-gray-800'}`}>
                  {faq.question}
                </span>
                <span className="text-2xl text-gray-400 font-light">
                  {openIdx === idx ? '−' : '+'}
                </span>
              </button>
              {openIdx === idx && (
                <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-100 text-center md:text-right text-sm">
        <p className="text-gray-500">
          Bạn cần hỗ trợ? <span className="text-red-600 font-medium cursor-pointer hover:underline">Hotline 1900 1881</span>
        </p>
      </div>
    </div>
  )
}

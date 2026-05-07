'use client'

import React, { useEffect, useState } from 'react'
import './news-detail.css' // Tái sử dụng file CSS của bạn hoặc tạo file riêng

interface ShareButtonsProps {
  title: string
}

export function ShareButtons({ title }: ShareButtonsProps) {
  const [url, setUrl] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // Lấy URL hiện tại trên client-side để tránh lỗi Hydration của Next.js
  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // Reset chữ "Đã copy" sau 2 giây
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Không render gì cả cho đến khi lấy được URL (giúp tránh lỗi giao diện giữa server và client)
  if (!url) return null

  return (
    <div className="share-buttons-container">
      <span className="share-label">Chia sẻ: </span>

      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn facebook"
      >
        Facebook
      </a>

      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn twitter"
      >
        Twitter
      </a>

      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn linkedin"
      >
        LinkedIn
      </a>

      <button onClick={copyToClipboard} className="share-btn copy-link">
        {isCopied ? '✓ Đã copy link' : '🔗 Copy Link'}
      </button>
    </div>
  )
}

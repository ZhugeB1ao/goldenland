import React from 'react'
import './(site)/styles.css'

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="scrollbar-hide">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface font-body">{children}</body>
    </html>
  )
}

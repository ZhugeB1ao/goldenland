import React from 'react'
import SideBar from './components/SideBar'

export const metadata = {
  title: 'Tài khoản của tôi - Golden Land',
  description: 'Quản lý tài khoản và thông tin cá nhân của bạn trên Golden Land',
}

export default async function AccountLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}

import React from 'react'
import AccountShell from './components/AccountShell'

export const metadata = {
  title: 'Tài khoản của tôi - Golden Land',
  description: 'Quản lý tài khoản và thông tin cá nhân của bạn trên Golden Land',
}

export default async function AccountLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return <AccountShell>{children}</AccountShell>
}

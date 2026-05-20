import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'

import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'

export const metadata = {
  title: 'Trang quản trị - Golden Land',
  description: 'Khu vực quản trị nội bộ Golden Land',
}

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/dang-nhap?redirect=/quan-tri')
  }

  if ((user as { role?: string }).role !== 'admin') {
    redirect('/')
  }

  const currentUser = {
    id: user.id,
    email: user.email ?? '',
    fullName: (user as { fullName?: string | null }).fullName ?? '',
    avatarUrl: (user as { avatar_id?: string | null }).avatar_id ?? null,
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopbar user={currentUser} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
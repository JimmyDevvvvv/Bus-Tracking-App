// app/admin/layout.tsx

'use client'
import { useRouter } from 'next/navigation'
import { isAdmin } from '@/lib/adminAuth'
import { AppSidebar } from '@/components/app-sidebar'
import { useEffect } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  useEffect(() => {
    if (!isAdmin()) router.push('/auth/login')
  }, [router])

  return (
    <div className="flex min-h-screen">
      
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}

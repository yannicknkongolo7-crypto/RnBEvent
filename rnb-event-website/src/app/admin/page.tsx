'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/admin')
    } else if ((session.user as { role?: string }).role !== 'admin') {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading' || !session?.user || (session.user as { role?: string }).role !== 'admin') {
    return null
  }

  return <AdminDashboard />
}
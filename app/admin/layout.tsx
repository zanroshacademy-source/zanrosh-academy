import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { isAdmin, getCurrentUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const adminOk = await isAdmin()
  if (!adminOk) redirect('/dashboard')

  const user = await getCurrentUser()
  const role = user?.role ?? 'admin'

  return (
    <div className="relative">
      <Navbar />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <AdminSidebar role={role} />
        <main style={{ flex: 1, padding: '2rem', overflowX: 'hidden', background: 'var(--bg-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

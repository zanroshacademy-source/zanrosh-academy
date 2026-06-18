import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Payment from '@/models/Payment'
import User from '@/models/User'
import { isSuperAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BookOpen, Users, CreditCard, TrendingUp, Crown, Shield } from 'lucide-react'
import Link from 'next/link'
import { formatPKR } from '@/lib/utils'
import Navbar from '@/components/Navbar'

async function getPlatformStats() {
  await connectDB()
  const [totalCourses, totalChapters, totalStudents, totalAdmins, totalSuperAdmins, revenueAgg, recentPayments] = await Promise.all([
    Course.countDocuments(),
    Chapter.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'super_admin' }),
    Payment.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.find().populate('chapterId', 'title price').populate('courseId', 'title price').sort({ createdAt: -1 }).limit(8).lean(),
  ])
  return { totalCourses, totalChapters, totalStudents, totalAdmins, totalSuperAdmins, totalRevenue: revenueAgg[0]?.total ?? 0, recentPayments }
}

export default async function SuperAdminPage() {
  const ok = await isSuperAdmin()
  if (!ok) redirect('/admin')

  const stats = await getPlatformStats()

  const cards = [
    { label: 'Total Courses',  value: stats.totalCourses,    icon: <BookOpen size={22} color="var(--accent-light)" />, href: '/admin/courses' },
    { label: 'Total Chapters', value: stats.totalChapters,   icon: <BookOpen size={22} color="#6366f1" />,            href: '/admin/courses' },
    { label: 'Students',       value: stats.totalStudents,   icon: <Users size={22} color="var(--green)" />,          href: '/admin/users' },
    { label: 'Admins',         value: stats.totalAdmins,     icon: <Shield size={22} color="var(--red)" />,           href: '/admin/users' },
    { label: 'Super Admins',   value: stats.totalSuperAdmins,icon: <Crown size={22} color="var(--amber)" />,          href: '/admin/users' },
    { label: 'Total Revenue',  value: formatPKR(stats.totalRevenue), icon: <TrendingUp size={22} color="var(--green)" />, href: '/admin/payments' },
  ]

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', padding: '1.75rem 2rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.08))', borderRadius: '1.25rem', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ width: 52, height: 52, borderRadius: '0.875rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Crown size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Super Admin Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Complete platform control & analytics — Zanrosh Academy</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            <Link href="/admin/users" className="btn-secondary" style={{ fontSize: '0.875rem' }}>Manage Users</Link>
            <Link href="/admin" className="btn-primary" style={{ fontSize: '0.875rem' }}>Admin Panel</Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {cards.map((c) => (
            <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                {c.icon}
                <div className="stat-value" style={{ fontSize: '1.6rem' }}>{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Payments */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} color="var(--accent-light)" /> Recent Payments
            </h2>
            <Link href="/admin/payments" style={{ fontSize: '0.875rem', color: 'var(--accent-light)', textDecoration: 'none' }}>View All →</Link>
          </div>

          {stats.recentPayments.length === 0 ? (
            <div className="alert alert-info">No payments yet.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Item</th><th>User ID</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {stats.recentPayments.map((pay: any) => (
                    <tr key={pay._id?.toString()}>
                      <td style={{ fontWeight: 500 }}>{typeof pay.courseId === 'object' ? `📚 ${pay.courseId?.title}` : typeof pay.chapterId === 'object' ? `📖 ${pay.chapterId?.title}` : '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pay.userId?.slice(0, 16)}…</td>
                      <td style={{ textTransform: 'capitalize' }}>{pay.method}</td>
                      <td style={{ fontWeight: 600 }}>{formatPKR(pay.amount)}</td>
                      <td><span className={`badge badge-${pay.status}`}>{pay.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(pay.createdAt).toLocaleDateString('en-PK')}</td>
                      <td>
                        <Link href={`/admin/payments/${pay._id}`} className={pay.status === 'pending' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
                          {pay.status === 'pending' ? 'Review' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

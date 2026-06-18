import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Payment from '@/models/Payment'
import User from '@/models/User'
import { auth } from '@clerk/nextjs/server'
import { isSuperAdmin } from '@/lib/auth'
import { BookOpen, Users, CreditCard, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatPKR } from '@/lib/utils'

async function getStats(userId: string, superAdmin: boolean) {
  await connectDB()

  const courseQuery = superAdmin ? {} : { adminId: userId }
  const courses = await Course.find(courseQuery).lean()
  const courseIds = courses.map(c => c._id)

  const chapters = await Chapter.countDocuments({ courseId: { $in: courseIds } })
  const users = superAdmin ? await User.countDocuments({ role: 'student' }) : 0

  const chapterDocs = await Chapter.find({ courseId: { $in: courseIds } }).select('_id').lean()
  const chapterIds = chapterDocs.map(c => c._id)

  const paymentQuery = superAdmin ? {} : { chapterId: { $in: chapterIds } }
  const [totalPayments, pendingPayments, revenueAgg] = await Promise.all([
    Payment.countDocuments(paymentQuery),
    Payment.find({ ...paymentQuery, status: 'pending' })
      .populate('chapterId', 'title price').sort({ createdAt: -1 }).limit(5).lean(),
    Payment.aggregate([
      { $match: { ...paymentQuery, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ])

  return {
    courses: courses.length, chapters, payments: totalPayments, users,
    pendingPayments, totalRevenue: revenueAgg[0]?.total ?? 0,
  }
}

export default async function AdminOverviewPage() {
  const { userId } = await auth()
  const superAdmin = await isSuperAdmin()
  const stats = await getStats(userId ?? '', superAdmin)

  const statCards = [
    { label: superAdmin ? 'All Courses' : 'My Courses', value: stats.courses, icon: <BookOpen size={22} color="var(--accent-light)" />, href: '/admin/courses' },
    { label: 'Total Chapters', value: stats.chapters, icon: <BookOpen size={22} color="#6366f1" />, href: '/admin/courses' },
    { label: 'Total Revenue', value: formatPKR(stats.totalRevenue), icon: <TrendingUp size={22} color="var(--green)" />, href: '/admin/payments' },
    { label: 'Total Payments', value: stats.payments, icon: <CreditCard size={22} color="var(--amber)" />, href: '/admin/payments' },
    { label: 'Pending', value: stats.pendingPayments.length, icon: <Clock size={22} color="var(--red)" />, href: '/admin/payments' },
    ...(superAdmin ? [{ label: 'Students', value: stats.users, icon: <Users size={22} color="var(--green)" />, href: '/admin/users' }] : []),
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">
          {superAdmin ? '👑 Platform Overview' : '📊 Dashboard'}
        </h1>
        <p className="section-subtitle">
          {superAdmin ? 'Complete platform analytics' : 'Your courses and payment activity'}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card hover:border-[#27187e] hover:shadow-[0_0_20px_rgba(39,24,126,0.2)] transition-all duration-300 cursor-pointer">
              {s.icon}
              <div className="stat-value" style={{ fontSize: '1.6rem' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending payments table */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--amber)" /> Pending Payments
          </h2>
          <Link href="/admin/payments" style={{ fontSize: '0.875rem', color: 'var(--accent-light)', textDecoration: 'none' }}>
            View All →
          </Link>
        </div>

        {stats.pendingPayments.length === 0 ? (
          <div className="alert alert-success">✅ No pending payments — all clear!</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Chapter</th><th>Method</th><th>Amount</th>
                  <th>Transaction ID</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {stats.pendingPayments.map((pay: any) => (
                  <tr key={pay._id?.toString()}>
                    <td style={{ fontWeight: 500 }}>{typeof pay.chapterId === 'object' ? pay.chapterId?.title : pay.chapterId}</td>
                    <td style={{ textTransform: 'capitalize' }}>{pay.method}</td>
                    <td>{formatPKR(pay.amount)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{pay.transactionId}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(pay.createdAt).toLocaleDateString('en-PK')}</td>
                    <td>
                      <Link href={`/admin/payments/${pay._id}`} className="btn-primary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}>
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

import { connectDB } from '@/lib/db'
import Purchase from '@/models/Purchase'
import Payment from '@/models/Payment'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { BookOpen, Clock, CheckCircle, XCircle, PlayCircle } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

async function getDashboardData(userId: string) {
  await connectDB()
  const [purchases, payments] = await Promise.all([
    Purchase.find({ userId })
      .populate('chapterId', 'title price duration courseId')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 }).lean(),
    Payment.find({ userId })
      .populate('chapterId', 'title price')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 }).lean(),
  ])
  return { purchases, payments }
}

export default async function StudentDashboardPage() {
  const { auth } = await import('@clerk/nextjs/server')
  const session = await auth()
  const userId = session.userId
  if (!userId) redirect('/sign-in')

  const { purchases, payments } = await getDashboardData(userId)
    const approved = purchases.filter((p: any) => p.status === 'approved')
    const pending = purchases.filter((p: any) => p.status === 'pending')

  return (
    <>
      <Navbar />
      <main className="page-container">
        <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>My Dashboard</h1>
        <p className="section-subtitle" style={{ marginBottom: '2.5rem' }}>Your purchased chapters and payment history</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Chapters Unlocked', value: approved.length, icon: <CheckCircle size={22} color="var(--green)" /> },
            { label: 'Pending Approvals', value: pending.length, icon: <Clock size={22} color="var(--amber)" /> },
            { label: 'Total Payments', value: payments.length, icon: <BookOpen size={22} color="var(--accent-light)" /> },
          ].map((s) => (
            <div key={s.label} className="stat-card">{s.icon}<div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-black text-[#27187e] mb-6 flex items-center gap-2">
            🎓 My Chapters
          </h2>
          {approved.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-[#4A5043]/60 font-medium flex flex-col items-center">
              <BookOpen size={48} className="mb-4 opacity-30" />
              <p className="mb-4">No content purchased yet</p>
              <Link href="/courses" className="bg-[#27187e] text-white px-6 py-2.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-md">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {approved.map((p: any) => {
                // p.courseId = full course purchase, p.chapterId = individual chapter purchase
                const isCourse = !!p.courseId && typeof p.courseId === 'object'
                const item = isCourse ? p.courseId : p.chapterId
                const watchHref = isCourse ? `/courses/${item?._id}` : `/watch/${item?._id}`
                const watchLabel = isCourse ? 'View Course' : 'Watch Chapter'
                return (
                  <div key={p._id.toString()} className="bg-white rounded-[2rem] p-6 border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)] hover:shadow-[0_20px_40px_rgba(39,24,126,0.12)] hover:-translate-y-2 transition-all duration-300 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#27187e]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-150" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-[#27187e]/10 text-[#27187e] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                          {isCourse ? '📚 Full Course' : '📖 Chapter'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                          <CheckCircle size={14} /> Unlocked
                        </span>
                      </div>

                      <h3 className="text-2xl font-black text-[#27187e] mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {item?.title}
                      </h3>
                      
                      <div className="mt-auto flex items-center justify-end pt-6">
                        <Link href={watchHref} className="bg-gradient-to-r from-[#27187e] to-[#1a0f5a] text-white px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-md group-hover:shadow-lg">
                          <PlayCircle size={18} /> {watchLabel}
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>💳 Payment History</h2>
          {payments.length === 0 ? (
            <div className="alert alert-info">No payment records found.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Chapter</th><th>Method</th><th>Amount</th><th>Transaction ID</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {payments.map((pay: any) => {
                    const itemTitle = typeof pay.courseId === 'object' ? `📚 ${pay.courseId?.title}` : typeof pay.chapterId === 'object' ? `📖 ${pay.chapterId?.title}` : '—'
                    return (
                      <tr key={pay._id.toString()}>
                        <td style={{ fontWeight: 500 }}>{itemTitle}</td>
                        <td style={{ textTransform: 'capitalize' }}>{pay.method}</td>
                        <td>{formatPKR(pay.amount)}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{pay.transactionId}</td>
                        <td><span className={`badge badge-${pay.status}`}>
                          {pay.status === 'approved' && <CheckCircle size={11} />}
                          {pay.status === 'rejected' && <XCircle size={11} />}
                          {pay.status === 'pending' && <Clock size={11} />}
                          {pay.status}
                        </span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(pay.createdAt).toLocaleDateString('en-PK')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  )
}

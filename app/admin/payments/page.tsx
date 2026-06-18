import { DEV_MODE } from '@/lib/dev-mode'
import { MOCK_PAYMENTS } from '@/lib/mock-data'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import { getServerAuth } from '@/lib/server-auth'
import { isSuperAdmin } from '@/lib/auth'
import Link from 'next/link'
import { Clock, CheckCircle, XCircle, Eye, CreditCard } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

async function getAdminPayments(userId: string, superAdmin: boolean) {
  if (DEV_MODE) return MOCK_PAYMENTS

  await connectDB()

  if (superAdmin) {
    return Payment.find()
      .populate('chapterId', 'title price')
      .sort({ createdAt: -1 })
      .lean()
  }

  // Scoped: only payments for this admin's course chapters
  const myCourses = await Course.find({ adminId: userId }).select('_id').lean()
  const myCourseIds = myCourses.map((c) => c._id)
  const myChapters = await Chapter.find({ courseId: { $in: myCourseIds } }).select('_id').lean()
  const myChapterIds = myChapters.map((c) => c._id)

  return Payment.find({ chapterId: { $in: myChapterIds } })
    .populate('chapterId', 'title price')
    .sort({ createdAt: -1 })
    .lean()
}

export default async function AdminPaymentsPage() {
  const { userId } = await getServerAuth()
  const superAdmin = await isSuperAdmin()
  const payments = await getAdminPayments(userId ?? 'dev_user_admin', superAdmin)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pending  = payments.filter((p: any) => p.status === 'pending')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approved = payments.filter((p: any) => p.status === 'approved')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rejected = payments.filter((p: any) => p.status === 'rejected')

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CreditCard size={28} color="var(--accent-light)" />
          {superAdmin ? 'All Payments' : 'My Payments'}
        </h1>
        <p className="section-subtitle">
          {superAdmin ? 'All payment submissions across the platform' : 'Payments for your courses — review and approve'}
        </p>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <span className="badge badge-pending"><Clock size={12} /> {pending.length} Pending</span>
        <span className="badge badge-approved"><CheckCircle size={12} /> {approved.length} Approved</span>
        <span className="badge badge-rejected"><XCircle size={12} /> {rejected.length} Rejected</span>
      </div>

      {payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
          <CreditCard size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No payments yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>When students purchase chapters, submissions will appear here.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Chapter</th>
                <th>User ID</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Transaction ID</th>
                <th>Screenshot</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {payments.map((pay: any) => {
                const ch = pay.chapterId
                return (
                  <tr key={pay._id.toString()}>
                    <td style={{ fontWeight: 500, maxWidth: 160 }}>{typeof ch === 'object' ? ch?.title : ch}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pay.userId?.slice(0, 16)}…
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{pay.method}</td>
                    <td style={{ fontWeight: 600 }}>{formatPKR(pay.amount)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{pay.transactionId}</td>
                    <td>
                      <a href={pay.screenshotUrl} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--accent-light)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={13} /> View
                      </a>
                    </td>
                    <td>
                      <span className={`badge badge-${pay.status}`}>
                        {pay.status === 'pending'  && <Clock size={11} />}
                        {pay.status === 'approved' && <CheckCircle size={11} />}
                        {pay.status === 'rejected' && <XCircle size={11} />}
                        {pay.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(pay.createdAt).toLocaleDateString('en-PK')}
                    </td>
                    <td>
                      <Link
                        href={`/admin/payments/${pay._id}`}
                        className={pay.status === 'pending' ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        {pay.status === 'pending' ? 'Review' : 'View'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

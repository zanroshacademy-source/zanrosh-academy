import { DEV_MODE } from '@/lib/dev-mode'
import { MOCK_PAYMENTS } from '@/lib/mock-data'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import { notFound } from 'next/navigation'
import { formatPKR } from '@/lib/utils'
import ApproveActions from '@/components/ApproveActions'
import Link from 'next/link'
import { ArrowLeft, Eye, Clock, CheckCircle, XCircle } from 'lucide-react'

export default async function PaymentReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

    let payment: any = null
  if (DEV_MODE) {
    payment = MOCK_PAYMENTS.find((p) => p._id === id) || null
    if (!payment) notFound()
    payment = { ...payment, _id: payment._id }
  } else {
    await connectDB()
    payment = await Payment.findById(id).populate('chapterId', 'title price courseId').lean()
    if (!payment) notFound()
  }

  const ch = typeof payment.chapterId === 'object' ? payment.chapterId : { title: String(payment.chapterId), price: 0 }

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/admin/payments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Payments
      </Link>
      <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>Review Payment</h1>
      <p className="section-subtitle" style={{ marginBottom: '2rem' }}>Verify the student&apos;s proof before granting access</p>

      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.05rem' }}>Payment Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { label: 'Chapter', value: ch?.title },
            { label: 'Amount', value: formatPKR(payment.amount) },
            { label: 'Payment Method', value: payment.method === 'easypaisa' ? 'Easypaisa' : 'JazzCash' },
            { label: 'Transaction ID', value: payment.transactionId },
            { label: 'Student Clerk ID', value: payment.userId },
            { label: 'Submitted At', value: new Date(payment.createdAt).toLocaleString('en-PK') },
          ].map((row) => (
            <div key={row.label} style={{ padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{row.label}</div>
              <div style={{ fontWeight: 600, wordBreak: 'break-all', fontSize: '0.9rem' }}>{row.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Current Status:</span>
          <span className={`badge badge-${payment.status}`} style={{ fontSize: '0.875rem', padding: '0.375rem 0.875rem' }}>
            {payment.status === 'pending' && <Clock size={13} />}
            {payment.status === 'approved' && <CheckCircle size={13} />}
            {payment.status === 'rejected' && <XCircle size={13} />}
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </span>
        </div>
        {payment.adminNote && <div className="alert alert-info" style={{ marginTop: '1rem' }}><strong>Admin Note:</strong> {payment.adminNote}</div>}
      </div>

      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Payment Screenshot</h2>
          <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8rem' }}><Eye size={14} /> Open Full Size</a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={payment.screenshotUrl} alt="Payment screenshot" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: '0.5rem', background: '#000', border: '1px solid var(--border)' }} />
      </div>

      {payment.status === 'pending' ? (
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.05rem' }}>Take Action</h2>
          <ApproveActions paymentId={id} />
        </div>
      ) : (
        <div className={`alert alert-${payment.status === 'approved' ? 'success' : 'error'}`}>
          {payment.status === 'approved' ? '✅ This payment was approved.' : '❌ This payment was rejected.'}
        </div>
      )}
    </div>
  )
}

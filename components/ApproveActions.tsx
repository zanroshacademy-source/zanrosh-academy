'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, AlertCircle, Trash2 } from 'lucide-react'

interface ApproveActionsProps {
  paymentId: string
}

export default function ApproveActions({ paymentId }: ApproveActionsProps) {
  const router = useRouter()
  const [adminNote, setAdminNote] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | 'delete' | null>(null)
  const [error, setError] = useState('')

  const handleAction = async (status: 'approved' | 'rejected') => {
    setError('')
    setLoading(status === 'approved' ? 'approve' : 'reject')

    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Action failed')
        return
      }

      router.refresh()
      router.push('/admin/payments')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to completely delete this payment record?')) return
    setError('')
    setLoading('delete')

    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        setError('Failed to delete')
        return
      }

      router.refresh()
      router.push('/admin/payments')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-[#27187e] font-bold mb-2 text-sm uppercase tracking-wider" htmlFor="adminNote">
          Admin Note (optional)
        </label>
        <textarea
          id="adminNote"
          rows={3}
          placeholder="e.g. Transaction verified. / Amount mismatch, please resubmit."
          className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400 resize-y"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2 font-medium">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          className="bg-gradient-to-br from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-black flex flex-col items-center justify-center gap-1 hover:from-green-600 hover:to-green-700 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 shadow-[0_8px_20px_rgba(34,197,94,0.3)]"
          disabled={!!loading}
          onClick={() => handleAction('approved')}
        >
          {loading === 'approve'
            ? <Loader2 size={24} className="animate-spin mb-1" />
            : <CheckCircle size={24} className="mb-1" />}
          <span>Approve & Unlock</span>
        </button>

        <button
          className="bg-gradient-to-br from-amber-500 to-amber-600 text-white px-6 py-4 rounded-xl font-black flex flex-col items-center justify-center gap-1 hover:from-amber-600 hover:to-amber-700 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 shadow-[0_8px_20px_rgba(245,158,11,0.3)]"
          disabled={!!loading}
          onClick={() => handleAction('rejected')}
        >
          {loading === 'reject'
            ? <Loader2 size={24} className="animate-spin mb-1" />
            : <XCircle size={24} className="mb-1" />}
          <span>Reject Payment</span>
        </button>

        <button
          className="bg-white text-red-500 border-2 border-red-100 px-6 py-4 rounded-xl font-black flex flex-col items-center justify-center gap-1 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-70 shadow-sm"
          disabled={!!loading}
          onClick={handleDelete}
        >
          {loading === 'delete'
            ? <Loader2 size={24} className="animate-spin mb-1" />
            : <Trash2 size={24} className="mb-1" />}
          <span>Delete Record</span>
        </button>
      </div>
    </div>
  )
}

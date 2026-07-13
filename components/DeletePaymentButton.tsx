'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this payment? This cannot be undone.')) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      router.refresh()
    } catch {
      alert('Error deleting payment')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={deleting}
      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Delete Payment"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  )
}

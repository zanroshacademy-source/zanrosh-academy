'use client'

import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'

interface Props {
  itemId: string
  itemType: 'course' | 'chapter'
  itemTitle: string
  price: number
}

export default function SafepayCheckoutButton({ itemId, itemType, itemTitle: _itemTitle, price: _price }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/safepay/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize checkout')
      }

      // Redirect to Safepay hosted checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-[#3a86ff] hover:bg-[#27187e] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
      >
        {loading ? (
          <><Loader2 size={20} className="animate-spin" /> Preparing Checkout...</>
        ) : (
          <><CreditCard size={20} /> Pay securely with Safepay</>
        )}
      </button>
      
      <p className="text-center text-xs text-[#4A5043]/70 font-medium flex flex-col gap-1">
        <span>Supports Easypaisa, JazzCash, Visa, and Mastercard.</span>
        <span>Secured by Safepay Pakistan.</span>
      </p>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-200">
          {error}
        </div>
      )}
    </div>
  )
}

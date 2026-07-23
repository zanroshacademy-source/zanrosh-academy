'use client'

import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'

interface Props {
  itemId: string
  itemType: 'course' | 'chapter'
}

export default function JazzCashCheckoutButton({ itemId, itemType }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobile, setMobile] = useState('')
  const [showMobile, setShowMobile] = useState(false)

  const handleClick = () => {
    if (!showMobile) {
      setShowMobile(true)
      return
    }
    handleCheckout()
  }

  const handleCheckout = async () => {
    if (!mobile || mobile.length < 10) {
      setError('Please enter a valid Pakistani mobile number (e.g. 03001234567)')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/jazzcash/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType, customerMobile: mobile }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize checkout')
      }

      if (data.endpoint && data.params) {
        // Create a hidden form and submit it
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.endpoint
        form.style.display = 'none'

        for (const key in data.params) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = data.params[key]
          form.appendChild(input)
        }

        document.body.appendChild(form)
        form.submit()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full mt-4">
      {showMobile && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-red-700 uppercase tracking-wider">
            Your Mobile Number (JazzCash required)
          </label>
          <input
            type="tel"
            placeholder="03001234567"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.trim())}
            onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
            className="w-full border border-red-700/20 focus:border-red-600 rounded-xl px-4 py-3 outline-none text-red-900 font-semibold text-sm transition-colors"
            disabled={loading}
            autoFocus
          />
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-100"
      >
        {loading ? (
          <><Loader2 size={20} className="animate-spin" /> Preparing Checkout...</>
        ) : showMobile ? (
          <><CreditCard size={20} /> Continue to JazzCash</>
        ) : (
          <><CreditCard size={20} /> Pay with JazzCash</>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-200">
          {error}
        </div>
      )}
    </div>
  )
}

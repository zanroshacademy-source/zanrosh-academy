'use client'

import { useState } from 'react'
import { Loader2, Zap } from 'lucide-react'

interface Props {
  itemId: string
  itemType: 'course' | 'chapter'
}

export default function RapidGatewayCheckoutButton({ itemId, itemType }: Props) {
  const [loading, setLoading] = useState(false)
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
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
      const res = await fetch('/api/rapidgateway/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType, customerMobile: mobile }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize checkout')
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {showMobile && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[#27187e] uppercase tracking-wider">
            Your Mobile Number (required by gateway)
          </label>
          <input
            type="tel"
            placeholder="03001234567"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.trim())}
            onKeyDown={(e) => e.key === 'Enter' && handleCheckout()}
            className="w-full border border-[#27187e]/20 focus:border-[#ff6b35] rounded-xl px-4 py-3 outline-none text-[#27187e] font-semibold text-sm transition-colors"
            disabled={loading}
            autoFocus
          />
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#ff6b35] to-[#f7931e] hover:from-[#e85a22] hover:to-[#e07d10] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-100"
      >
        {loading ? (
          <><Loader2 size={20} className="animate-spin" /> Preparing Checkout...</>
        ) : showMobile ? (
          <><Zap size={20} /> Continue to RapidGateway</>
        ) : (
          <><Zap size={20} /> Pay with RapidGateway</>
        )}
      </button>

      <p className="text-center text-xs text-[#4A5043]/70 font-medium flex flex-col gap-0.5">
        <span>Supports Card, Easypaisa, JazzCash, Bank & Raast.</span>
        <span>Secured by RapidGateway Pakistan.</span>
      </p>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-200">
          {error}
        </div>
      )}
    </div>
  )
}

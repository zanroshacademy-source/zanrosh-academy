'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Smartphone, CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  itemId:   string
  itemType: 'course' | 'chapter'
}

type Stage = 'idle' | 'loading' | 'waiting' | 'success' | 'failed'

export default function EasypaisaCheckoutButton({ itemId, itemType }: Props) {
  const router = useRouter()

  const [stage,    setStage]   = useState<Stage>('idle')
  const [mobile,   setMobile]  = useState('')
  const [email,    setEmail]   = useState('')
  const [error,    setError]   = useState('')
  const [orderId,  setOrderId] = useState('')
  const [message,  setMessage] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clear polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const startPolling = (oid: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/easypaisa/verify?orderId=${oid}`)
        const data = await res.json()

        if (data.status === 'PAID') {
          stopPolling()
          setStage('success')
          setTimeout(() => {
            if (data.itemType === 'course') router.push(`/courses/${data.itemId}`)
            else router.push(`/dashboard`)
          }, 2000)
        } else if (data.status === 'FAILED') {
          stopPolling()
          setStage('failed')
          setError(data.message || 'Payment failed or was declined.')
        }
        // Otherwise still PENDING — keep polling
      } catch { /* network hiccup — keep polling */ }
    }, 4000) // Poll every 4 seconds
  }

  const handlePay = async () => {
    setError('')

    // Basic validation
    if (!/^03\d{9}$/.test(mobile)) {
      setError('Enter a valid 11-digit number starting with 03 (e.g. 03001234567)')
      return
    }
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address')
      return
    }

    setStage('loading')

    try {
      const res = await fetch('/api/easypaisa/create-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ itemId, itemType, mobileAccountNo: mobile, emailAddress: email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to initiate payment')
        setStage('idle')
        return
      }

      setOrderId(data.orderId)
      setMessage(data.message || 'Please approve the USSD prompt on your phone.')
      setStage('waiting')
      startPolling(data.orderId)

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setStage('idle')
    }
  }

  const handleCancel = () => {
    stopPolling()
    setStage('idle')
    setError('')
    setMessage('')
  }

  // ── Stages ──────────────────────────────────────────────────────────────────

  if (stage === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 p-6 bg-green-50 rounded-xl border border-green-200 text-green-700 mt-4">
        <CheckCircle2 size={40} className="text-green-500" />
        <p className="font-bold text-lg">Payment Successful!</p>
        <p className="text-sm text-center">Redirecting you to your course…</p>
      </div>
    )
  }

  if (stage === 'failed') {
    return (
      <div className="flex flex-col items-center gap-3 p-6 bg-red-50 rounded-xl border border-red-200 text-red-700 mt-4">
        <XCircle size={40} className="text-red-500" />
        <p className="font-bold text-lg">Payment Failed</p>
        <p className="text-sm text-center">{error}</p>
        <button
          onClick={handleCancel}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (stage === 'waiting') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-green-50 rounded-xl border border-green-200 mt-4">
        <Loader2 size={36} className="animate-spin text-green-600" />
        <p className="font-bold text-green-800 text-center">Waiting for your approval…</p>
        <p className="text-sm text-green-700 text-center">{message}</p>
        <p className="text-xs text-green-600 text-center">
          📱 Check your phone for the Easypaisa payment notification and approve it.
        </p>
        <button
          onClick={handleCancel}
          className="mt-1 text-xs text-red-500 underline hover:text-red-700"
        >
          Cancel
        </button>
      </div>
    )
  }

  // ── idle / loading ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 w-full mt-4">
      {/* Mobile Number Input */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">
          Easypaisa Mobile Number
        </label>
        <input
          type="tel"
          value={mobile}
          onChange={e => setMobile(e.target.value.trim())}
          placeholder="03001234567"
          maxLength={11}
          disabled={stage === 'loading'}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        />
      </div>

      {/* Email Input */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value.trim())}
          placeholder="you@example.com"
          disabled={stage === 'loading'}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        />
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={stage === 'loading'}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-100"
      >
        {stage === 'loading' ? (
          <><Loader2 size={20} className="animate-spin" /> Sending request…</>
        ) : (
          <><Smartphone size={20} /> Pay with Easypaisa</>
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

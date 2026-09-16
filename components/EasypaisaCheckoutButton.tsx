'use client'

import { useState } from 'react'
import { Loader2, Smartphone } from 'lucide-react'

interface Props {
  itemId: string
  itemType: 'course' | 'chapter'
}

export default function EasypaisaCheckoutButton({ itemId, itemType }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/easypaisa/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize Easypaisa checkout')
      }

      if (data.endpoint && data.params) {
        // Build a hidden form and submit it — Easypaisa requires a form POST
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.endpoint
        form.style.display = 'none'

        for (const key in data.params) {
          const input = document.createElement('input')
          input.type  = 'hidden'
          input.name  = key
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
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-100"
      >
        {loading ? (
          <><Loader2 size={20} className="animate-spin" /> Preparing Easypaisa...</>
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

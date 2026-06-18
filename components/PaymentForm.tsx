'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle, Loader2, Copy, Check, MessageCircle } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

interface PaymentFormProps {
  itemId: string
  itemType: 'course' | 'chapter'
  itemTitle: string
  price: number
  userEmail: string
}

// ✏️ Change this to your real WhatsApp number (with country code, no + or spaces)
const WHATSAPP_NUMBER = '923001234567'

export default function PaymentForm({ itemId, itemType, itemTitle, price, userEmail }: PaymentFormProps) {
  const router = useRouter()
  const [method, setMethod] = useState<'easypaisa' | 'jazzcash'>('easypaisa')
  const [transactionId, setTransactionId] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const paymentNumbers = {
    easypaisa: process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || '0300-0000000',
    jazzcash:  process.env.NEXT_PUBLIC_JAZZCASH_NUMBER  || '0311-0000000',
  }
  const accountName = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME || 'Zanrosh Academy'

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setError('')
    try {
      const sigRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'maqbool-academy/payment-proofs', resource_type: 'image' }),
      })
      const { data: sig } = await sigRes.json()
      if (!sig) throw new Error('Could not get upload signature')

      await new Promise<void>((resolve, reject) => {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('api_key', sig.apiKey)
        fd.append('timestamp', String(sig.timestamp))
        fd.append('signature', sig.signature)
        fd.append('folder', sig.folder)
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText)
            if (data.secure_url) { setScreenshotUrl(data.secure_url); resolve() }
            else reject(new Error('Upload failed'))
          } else reject(new Error('Upload failed'))
        }
        xhr.onerror = () => reject(new Error('Upload error'))
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`)
        xhr.send(fd)
      })
    } catch {
      setError('Screenshot upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: itemType, itemId, method, transactionId, screenshotUrl }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 3000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-[#27187e] mb-3">Payment Submitted!</h2>
        <p className="text-[#4A5043] mb-2">
          Your payment proof has been received. The {itemType} will be unlocked within <strong>2–4 hours</strong> after verification.
        </p>
        <p className="text-gray-400 text-sm">Redirecting to your dashboard…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* Chapter summary */}
      <div className="bg-[#27187e]/5 rounded-2xl p-5 border border-[#27187e]/10">
        <p className="text-xs font-bold uppercase tracking-wider text-[#27187e]/60 mb-1">You are purchasing</p>
        <p className="text-xl font-black text-[#27187e]">{itemTitle}</p>
        <p className="text-3xl font-black text-[#27187e] mt-1">{formatPKR(price)}</p>
      </div>

      {/* Method selection */}
      <div>
        <label className="block text-[#27187e] font-bold mb-3 text-sm uppercase tracking-wider">Select Payment Method</label>
        <div className="grid grid-cols-2 gap-4">
          {(['easypaisa', 'jazzcash'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)}
              className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
                method === m
                  ? 'border-[#27187e] bg-[#27187e]/5 shadow-[0_0_0_4px_rgba(39,24,126,0.1)]'
                  : 'border-gray-200 bg-white hover:border-[#27187e]/40'
              }`}>
              {method === m && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-[#27187e] rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <Image
                src={m === 'easypaisa' ? '/easypaisa-seeklogo.png' : '/jazz-cash-new-seeklogo.png'}
                alt={m === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}
                width={90} height={40}
                className="object-contain h-10 w-auto"
              />
              <span className="font-bold text-[#27187e] text-sm">{m === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment instructions */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
        <h3 className="font-black text-[#27187e] text-base mb-4">📱 Send {formatPKR(price)} to:</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Account Name', value: accountName, key: 'name' },
            { label: `${method === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} Number`, value: paymentNumbers[method], key: 'number' },
            { label: 'Amount', value: formatPKR(price), key: 'amount' },
          ].map((row) => (
            <div key={row.key} className="flex justify-between items-center bg-white rounded-xl px-4 py-3 border border-gray-100">
              <div>
                <div className="text-xs text-gray-400 font-medium mb-0.5">{row.label}</div>
                <div className="font-bold text-[#27187e] font-mono text-lg">{row.value}</div>
              </div>
              <button type="button" onClick={() => copyToClipboard(row.value, row.key)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                {copied === row.key ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-400" />}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium">
          ⚠️ Include your email <strong>({userEmail})</strong> in the payment note if supported.
        </div>
      </div>

      {/* Transaction ID */}
      <div>
        <label className="block text-[#27187e] font-bold mb-2 text-sm uppercase tracking-wider" htmlFor="txId">
          Transaction ID / Reference Number *
        </label>
        <input id="txId" type="text"
          className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400"
          placeholder="e.g. EP1234567890"
          value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
          required minLength={5} />
      </div>

      {/* Screenshot upload — no URL paste */}
      <div>
        <label className="block text-[#27187e] font-bold mb-2 text-sm uppercase tracking-wider">Payment Screenshot *</label>
        <div className="bg-[#f7f7ff] rounded-xl border-2 border-dashed border-[#27187e]/20 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden hover:border-[#27187e]/50 transition-colors min-h-[160px]">
          {screenshotUrl ? (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshotUrl} alt="Payment proof" className="max-h-40 rounded-lg border border-gray-200 shadow-sm" />
              <span className="text-green-600 font-bold text-sm">✓ Screenshot uploaded</span>
              <button type="button" onClick={() => setScreenshotUrl('')}
                className="text-xs text-red-400 underline">Remove & re-upload</button>
            </div>
          ) : (
            <>
              <Upload size={36} className="text-[#27187e]/20 mb-3" />
              <p className="text-[#4A5043]/60 text-sm mb-4">Take a screenshot of your payment and upload it here</p>
              <input type="file" accept="image/*" id="screenshotFile" className="hidden"
                onChange={handleScreenshotUpload} disabled={uploading} />
              <label htmlFor="screenshotFile"
                className="bg-[#27187e] text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer hover:scale-105 transition-transform flex items-center gap-2">
                {uploading
                  ? <><Loader2 size={16} className="animate-spin" /> Uploading {uploadProgress}%</>
                  : <><Upload size={16} /> Upload Screenshot</>}
              </label>
            </>
          )}
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#27187e]/10">
              <div className="h-full bg-[#27187e] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2 font-medium">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <button type="submit"
        className="w-full bg-[#27187e] text-white py-4 rounded-xl font-black text-lg hover:scale-[1.02] hover:shadow-xl transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
        disabled={loading || uploading || !screenshotUrl || !transactionId}>
        {loading ? <><Loader2 size={20} className="animate-spin" />Submitting...</> : 'Submit Payment Proof'}
      </button>

      <p className="text-gray-400 text-sm text-center">Access unlocks after admin verification (usually within 2–4 hours)</p>

      {/* WhatsApp Support */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20have%20an%20issue%20with%20my%20payment%20for%20the%20${itemType}%3A%20${encodeURIComponent(itemTitle)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 bg-[#25D366] text-white py-3.5 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-md"
      >
        <MessageCircle size={20} />
        Need help? Contact us on WhatsApp
      </a>
    </form>
  )
}

'use client'

import { useState, useRef } from 'react'
import { Loader2, CheckCircle2, XCircle, QrCode, Upload, ImageIcon } from 'lucide-react'

interface Props {
  itemId: string
  itemType: 'course' | 'chapter' | 'topic'
  price: number
  easypaisaNumber?: string
  userEmail?: string
}

type Stage = 'idle' | 'loading' | 'submitted' | 'failed'

export default function EasypaisaCheckoutButton({
  itemId,
  itemType,
  price,
  userEmail = '',
}: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [txId, setTxId] = useState('')
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleScreenshotSubmit = async () => {
    setError('')
    if (!file) {
      setError('Please select a payment screenshot before submitting.')
      return
    }
    setStage('loading')
    try {
      const fd = new FormData()
      fd.append('screenshot', file)
      fd.append('itemId', itemId)
      fd.append('itemType', itemType)
      fd.append('transactionId', txId.trim())
      fd.append('userEmail', userEmail)
      fd.append('method', 'easypaisa_qr')

      const res = await fetch('/api/easypaisa/screenshot', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upload failed. Please try again.')
        setStage('idle')
        return
      }
      setStage('submitted')
    } catch (e: any) {
      setError(e.message || 'Upload failed. Please try again.')
      setStage('idle')
    }
  }

  const reset = () => {
    setStage('idle')
    setError('')
    setFile(null)
    setPreview(null)
    setTxId('')
  }

  // ── SUBMITTED STATE ────────────────────────────────────────────────────────
  if (stage === 'submitted') {
    return (
      <div className="flex flex-col items-center gap-3 p-6 sm:p-8 bg-blue-50/80 rounded-2xl border border-blue-200 text-center mt-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-1">
          <CheckCircle2 size={36} />
        </div>
        <p className="font-black text-xl text-[#27187e]">Payment Proof Submitted! ✅</p>
        <p className="text-sm font-bold text-blue-900 max-w-sm">
          You will get access in 24 hours for this unit.
        </p>
        <p className="text-xs text-[#4A5043]/70 max-w-sm">
          Our academy admin is reviewing your screenshot. Once approved, the unit will be immediately unlocked and you will receive a confirmation email.
        </p>
      </div>
    )
  }

  // ── FAILED STATE ───────────────────────────────────────────────────────────
  if (stage === 'failed') {
    return (
      <div className="flex flex-col items-center gap-3 p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700 mt-4 text-center">
        <XCircle size={36} className="text-red-500" />
        <p className="font-bold text-lg">Submission Failed</p>
        <p className="text-sm">{error || 'Something went wrong.'}</p>
        <button
          onClick={reset}
          className="mt-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  // ── DIRECT QR & SCREENSHOT FLOW ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 w-full mt-2">
      {/* ── 1. QR Code Card ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-emerald-50/60 to-white border-2 border-emerald-200/80 rounded-2xl p-5 text-center shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider mb-3">
          <QrCode size={13} /> Pay via Easypaisa QR
        </div>

        <h3 className="text-base sm:text-lg font-black text-[#27187e] mb-1">
          Scan QR Code with Easypaisa App
        </h3>
        <p className="text-sm text-[#4A5043]/80 mb-4">
          Send exact amount: <strong className="text-emerald-700 font-black text-base">PKR {price.toLocaleString()}</strong>
        </p>

        {/* QR image */}
        <div className="bg-white p-3 rounded-2xl inline-block shadow-md border border-gray-100">
          <div className="relative w-52 h-52 sm:w-56 sm:h-56 mx-auto flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qr.jpeg"
              alt="Easypaisa QR Code"
              className="object-contain w-full h-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
              <QrCode size={56} className="text-emerald-600 mb-2" />
              <p className="font-bold text-xs text-[#27187e]">Easypaisa QR Code</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 pt-3 border-t border-emerald-100 text-xs text-[#4A5043] flex flex-col gap-1.5 text-left bg-white/80 rounded-xl p-3.5 border border-emerald-50">
          <p className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
            <span>Open your <strong>Easypaisa App</strong> &amp; tap <strong>Scan QR</strong></span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
            <span>Scan the code above and pay <strong>PKR {price.toLocaleString()}</strong></span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
            <span>Take a screenshot of the payment receipt &amp; upload below</span>
          </p>
        </div>
      </div>

      {/* ── 2. Screenshot Upload Form ──────────────────────────────────────── */}
      <div className="bg-white border border-[#27187e]/10 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Upload size={18} className="text-[#3a86ff]" />
          <h4 className="font-black text-[#27187e] text-base">Upload Payment Screenshot</h4>
        </div>

        {/* TRX ID (optional) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Transaction ID / TRX ID <span className="text-gray-400 font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="e.g. 23891481928"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#27187e]/30 font-mono"
          />
        </div>

        {/* Screenshot file picker */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Payment Screenshot <span className="text-red-500">*</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
              preview
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-gray-300 hover:border-[#3a86ff] hover:bg-gray-50 text-gray-400 hover:text-[#3a86ff]'
            }`}
          >
            {preview ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Payment preview"
                  className="max-h-44 rounded-xl object-contain border border-emerald-200 shadow-sm"
                />
                <span className="text-xs font-bold text-emerald-700">Tap to replace image</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3a86ff] flex items-center justify-center">
                  <ImageIcon size={22} />
                </div>
                <span className="text-sm font-bold text-gray-700">Tap to choose screenshot</span>
                <span className="text-xs text-gray-400">PNG, JPG or JPEG from your phone/PC</span>
              </>
            )}
          </button>
          {file && (
            <p className="text-xs text-emerald-700 font-semibold text-center mt-1">
              ✓ Selected: {file.name}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleScreenshotSubmit}
          disabled={stage === 'loading' || !file}
          className="w-full bg-[#27187e] hover:bg-[#1a0f5a] text-white font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md hover:scale-[1.01] active:scale-100 text-sm"
        >
          {stage === 'loading' ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Submitting Proof...
            </>
          ) : (
            <>
              <Upload size={18} /> Submit Screenshot Proof
            </>
          )}
        </button>
      </div>
    </div>
  )
}

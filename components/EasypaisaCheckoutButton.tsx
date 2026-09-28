'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Smartphone, CheckCircle2, XCircle, QrCode, Upload, ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  itemId:   string
  itemType: 'course' | 'chapter'
  price:    number
  easypaisaNumber: string
}

type Method = 'ma' | 'qr' | 'screenshot'
type Stage  = 'idle' | 'loading' | 'waiting' | 'success' | 'failed' | 'submitted'

const EP_NUMBER = process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || '03332121979'

export default function EasypaisaCheckoutButton({ itemId, itemType, price, easypaisaNumber }: Props) {
  const router = useRouter()

  const [method,   setMethod]  = useState<Method>('ma')
  const [stage,    setStage]   = useState<Stage>('idle')
  const [mobile,   setMobile]  = useState('')
  const [email,    setEmail]   = useState('')
  const [txId,     setTxId]    = useState('')
  const [error,    setError]   = useState('')
  const [orderId,  setOrderId] = useState('')
  const [message,  setMessage] = useState('')
  const [file,     setFile]    = useState<File | null>(null)
  const [preview,  setPreview] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
            else router.push('/dashboard')
          }, 2000)
        } else if (data.status === 'FAILED') {
          stopPolling()
          setStage('failed')
          setError(data.message || 'Payment was declined.')
        }
      } catch { /* keep polling */ }
    }, 4000)
  }

  const reset = () => {
    stopPolling()
    setStage('idle')
    setError('')
    setMessage('')
    setFile(null)
    setPreview(null)
  }

  // ── Method A: Direct MA ────────────────────────────────────────────────────
  const handleMAPay = async () => {
    setError('')
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
      const res  = await fetch('/api/easypaisa/create-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType, mobileAccountNo: mobile, emailAddress: email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to initiate payment'); setStage('idle'); return }
      setOrderId(data.orderId)
      setMessage(data.message || 'Please approve the USSD prompt on your phone.')
      setStage('waiting')
      startPolling(data.orderId)
    } catch (e: any) { setError(e.message || 'Something went wrong'); setStage('idle') }
  }

  // ── Method B/C: Screenshot Upload ─────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleScreenshotSubmit = async () => {
    setError('')
    if (!file) { setError('Please select a screenshot of your payment'); return }
    setStage('loading')
    try {
      const fd = new FormData()
      fd.append('screenshot', file)
      fd.append('itemId', itemId)
      fd.append('itemType', itemType)
      fd.append('transactionId', txId)
      fd.append('method', method === 'qr' ? 'easypaisa_qr' : 'easypaisa_screenshot')
      const res  = await fetch('/api/easypaisa/screenshot', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Upload failed'); setStage('idle'); return }
      setMessage(data.message || 'Submitted! Admin will review shortly.')
      setStage('submitted')
    } catch (e: any) { setError(e.message || 'Upload failed'); setStage('idle') }
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (stage === 'success') return (
    <div className="flex flex-col items-center gap-3 p-6 bg-green-50 rounded-xl border border-green-200 text-green-700 mt-4">
      <CheckCircle2 size={40} className="text-green-500" />
      <p className="font-bold text-lg">Payment Successful!</p>
      <p className="text-sm">Redirecting to your course…</p>
    </div>
  )

  if (stage === 'submitted') return (
    <div className="flex flex-col items-center gap-3 p-6 bg-blue-50 rounded-xl border border-blue-200 text-blue-700 mt-4">
      <CheckCircle2 size={40} className="text-blue-500" />
      <p className="font-bold text-lg">Screenshot Submitted! ✅</p>
      <p className="text-sm text-center">{message}</p>
      <p className="text-xs text-center text-blue-500">You will receive access once the admin approves your payment.</p>
    </div>
  )

  if (stage === 'failed') return (
    <div className="flex flex-col items-center gap-3 p-6 bg-red-50 rounded-xl border border-red-200 text-red-700 mt-4">
      <XCircle size={40} className="text-red-500" />
      <p className="font-bold text-lg">Payment Failed</p>
      <p className="text-sm text-center">{error}</p>
      <button onClick={reset} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Try Again</button>
    </div>
  )

  if (stage === 'waiting') return (
    <div className="flex flex-col items-center gap-4 p-6 bg-green-50 rounded-xl border border-green-200 mt-4">
      <Loader2 size={36} className="animate-spin text-green-600" />
      <p className="font-bold text-green-800 text-center">Waiting for your approval…</p>
      <p className="text-sm text-green-700 text-center">{message}</p>
      <p className="text-xs text-green-600 text-center">📱 Check your phone for the Easypaisa notification and approve it.</p>
      <button onClick={reset} className="mt-1 text-xs text-red-500 underline hover:text-red-700">Cancel</button>
    </div>
  )

  // ── TABS UI ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 w-full mt-4">

      {/* Tab selector */}
      <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'ma',         icon: <Smartphone size={14} />, label: 'Mobile Account' },
          { key: 'qr',         icon: <QrCode size={14} />,     label: 'QR Code'        },
          { key: 'screenshot', icon: <Upload size={14} />,     label: 'Screenshot'     },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setMethod(tab.key as Method); setError('') }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              method === tab.key
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab A: Direct MA ─────────────────────────────────────────────── */}
      {method === 'ma' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500 text-center">Enter your Easypaisa number. You'll get a USSD prompt to approve on your phone.</p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Easypaisa Mobile Number</label>
            <input type="tel" value={mobile} onChange={e => setMobile(e.target.value.trim())} placeholder="03001234567" maxLength={11}
              disabled={stage === 'loading'}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value.trim())} placeholder="you@example.com"
              disabled={stage === 'loading'}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
          </div>
          <button onClick={handleMAPay} disabled={stage === 'loading'}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md hover:scale-[1.02] active:scale-100">
            {stage === 'loading' ? <><Loader2 size={20} className="animate-spin" /> Sending…</> : <><Smartphone size={20} /> Pay with Easypaisa</>}
          </button>
        </div>
      )}

      {/* ── Tab B: QR Code ───────────────────────────────────────────────── */}
      {method === 'qr' && (
        <div className="flex flex-col gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-green-800 mb-3">Scan this QR code with your Easypaisa App</p>
            {/* Static merchant QR — scan with Easypaisa app to send money */}
            <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
              <div className="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 text-xs text-center">
                <div>
                  <QrCode size={64} className="mx-auto mb-2 text-green-600" />
                  <p className="font-bold text-green-700">Easypaisa</p>
                  <p className="text-green-600 font-semibold">{easypaisaNumber}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-green-700 mt-3">Open Easypaisa App → Scan QR → Send <strong>PKR {price}</strong></p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            📸 After paying, take a screenshot and upload it below for admin verification.
          </div>
          {/* Screenshot section for QR */}
          <ScreenshotSection
            txId={txId} setTxId={setTxId}
            file={file} preview={preview}
            fileRef={fileRef} handleFileChange={handleFileChange}
            onSubmit={handleScreenshotSubmit}
            loading={stage === 'loading'}
          />
        </div>
      )}

      {/* ── Tab C: Screenshot Upload ──────────────────────────────────────── */}
      {method === 'screenshot' && (
        <div className="flex flex-col gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            📲 Send <strong>PKR {price}</strong> to Easypaisa number <strong>{easypaisaNumber}</strong>, then upload your screenshot below.
          </div>
          <ScreenshotSection
            txId={txId} setTxId={setTxId}
            file={file} preview={preview}
            fileRef={fileRef} handleFileChange={handleFileChange}
            onSubmit={handleScreenshotSubmit}
            loading={stage === 'loading'}
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-200">{error}</div>
      )}
    </div>
  )
}

// ── Shared screenshot sub-component ─────────────────────────────────────────
function ScreenshotSection({
  txId, setTxId, file, preview, fileRef, handleFileChange, onSubmit, loading
}: {
  txId: string; setTxId: (v: string) => void
  file: File | null; preview: string | null
  fileRef: React.RefObject<HTMLInputElement | null>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void; loading: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">Transaction ID (optional)</label>
        <input type="text" value={txId} onChange={e => setTxId(e.target.value)} placeholder="e.g. EP123456789"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">Payment Screenshot <span className="text-red-500">*</span></label>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:text-green-600 transition-colors">
          {preview ? (
            <img src={preview} alt="preview" className="max-h-32 rounded-lg object-contain" />
          ) : (
            <><ImageIcon size={32} /><span className="text-sm font-medium">Tap to upload screenshot</span></>
          )}
        </button>
        {file && <p className="text-xs text-gray-500 text-center">{file.name}</p>}
      </div>

      <button onClick={onSubmit} disabled={loading || !file}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md hover:scale-[1.02] active:scale-100">
        {loading ? <><Loader2 size={20} className="animate-spin" /> Uploading…</> : <><Upload size={20} /> Submit Screenshot</>}
      </button>
    </div>
  )
}

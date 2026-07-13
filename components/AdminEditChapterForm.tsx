'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react'

interface Unit {
  _id: string
  title: string
  description?: string
  price: number
  accessDays?: number
  isFree: boolean
  isPublished: boolean
}

interface AdminEditChapterFormProps {
  chapter: Unit
  onClose: () => void
}

export default function AdminEditChapterForm({ chapter, onClose }: AdminEditChapterFormProps) {
  const router = useRouter()
  const [title, setTitle]           = useState(chapter.title)
  const [description, setDescription] = useState(chapter.description || '')
  const [price, setPrice]           = useState(chapter.price.toString())
  const [accessDays, setAccessDays] = useState(String(chapter.accessDays ?? 15))
  const [isFree, setIsFree]         = useState(chapter.isFree)
  const [isPublished, setIsPublished] = useState(chapter.isPublished)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/chapters/${chapter._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: price === '' || isNaN(parseFloat(price)) ? 400 : parseFloat(price),
          accessDays: accessDays === '' || isNaN(parseInt(accessDays)) ? 15 : parseInt(accessDays),
          isFree,
          isPublished,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to update unit'); return }
      setSuccess(true)
      router.refresh()
      setTimeout(() => onClose(), 1200)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 text-emerald-700 px-4 py-4 rounded-xl border border-emerald-200 flex items-center gap-3 font-semibold text-sm">
        <CheckCircle size={18} /> Unit updated successfully!
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-[#f7f7ff] rounded-2xl p-5 relative border border-[#27187e]/10">
      <h4 className="font-black text-[#27187e] text-base flex items-center gap-2">
        <CheckCircle size={18} /> Edit Unit
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left */}
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1 text-xs uppercase tracking-wider">Unit Title *</label>
            <input type="text"
              className="w-full bg-white border border-[#27187e]/10 focus:border-[#27187e]/40 rounded-xl px-4 py-2.5 outline-none text-[#4A5043] font-medium text-sm"
              value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1 text-xs uppercase tracking-wider">Description</label>
            <textarea rows={3}
              className="w-full bg-white border border-[#27187e]/10 rounded-xl px-4 py-2.5 outline-none text-[#4A5043] font-medium resize-y text-sm"
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
          {/* Price */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1 text-xs uppercase tracking-wider">Price (PKR)</label>
            <input type="number" min={0}
              className="w-full bg-white border border-[#27187e]/10 focus:border-[#27187e]/40 rounded-xl px-4 py-2.5 outline-none text-[#4A5043] font-medium text-sm"
              value={price} onChange={e => setPrice(e.target.value)} />
          </div>

          {/* Access Days */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1 text-xs uppercase tracking-wider">
              Access Duration (Days)
            </label>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={365}
                className="flex-1 bg-white border border-[#27187e]/10 focus:border-[#27187e]/40 rounded-xl px-4 py-2.5 outline-none text-[#4A5043] font-medium text-sm"
                value={accessDays} onChange={e => setAccessDays(e.target.value)} />
              <div className="flex items-center gap-1 text-xs font-bold text-[#4A5043]/50 shrink-0">
                <Lock size={12} /> days
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">How long after payment approval the student can access this unit.</p>
          </div>

          {/* Flags */}
          <div className="flex flex-col gap-2">
            {[
              { key: 'isFree', label: 'Free Unit', val: isFree, set: setIsFree },
              { key: 'isPublished', label: 'Published', val: isPublished, set: setIsPublished },
            ].map(({ key, label, val, set }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)}
                  className="w-5 h-5 accent-[#27187e]" />
                <span className="font-semibold text-sm text-[#4A5043]">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2 font-medium text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button type="submit" disabled={loading}
          className="bg-[#27187e] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100 text-sm">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><CheckCircle size={15} /> Save Changes</>}
        </button>
        <button type="button" onClick={onClose}
          className="px-5 py-2.5 rounded-xl font-bold text-[#4A5043] hover:bg-gray-200 bg-gray-100 transition-colors text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react'

interface AdminAddChapterFormProps {
  courseId: string
  nextOrder: number
}

export default function AdminAddChapterForm({ courseId, nextOrder }: AdminAddChapterFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '400',
    accessDays: '15',
    isFree: false,
    isPublished: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(false); setLoading(true)

    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: form.title,
          description: form.description,
          price: parseFloat(form.price) || 400,
          accessDays: parseInt(form.accessDays) || 15,
          order: nextOrder,
          isFree: form.isFree,
          isPublished: form.isPublished,
          // Videos live on Topics, not Units — leave these empty
          videoUrl: '',
          cloudinaryPublicId: '',
          videoProvider: '',
          duration: 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create unit'); return }

      setSuccess(true)
      setForm({ title: '', description: '', price: '400', accessDays: '15', isFree: false, isPublished: false })
      setTimeout(() => router.refresh(), 100)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {success && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100 flex items-center gap-2 font-medium text-sm">
          <CheckCircle size={16} /> Unit created! Add topics to it above.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider" htmlFor="unitTitle">Unit Title *</label>
            <input id="unitTitle" type="text"
              placeholder="e.g. Unit 1: Kinematics"
              className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400 text-sm"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required minLength={2} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider" htmlFor="unitDesc">Description</label>
            <textarea id="unitDesc" rows={3}
              placeholder="What topics does this unit cover?"
              className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400 resize-y text-sm"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Price */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider" htmlFor="unitPrice">Unit Price (PKR)</label>
            <input id="unitPrice" type="number"
              className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium text-sm"
              placeholder="400"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              min={0} />
            <p className="text-[10px] text-gray-400 mt-1 pl-1">Students pay this to unlock all topics in this unit.</p>
          </div>

          {/* Access Days */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider" htmlFor="unitDays">
              Access Duration (Days)
            </label>
            <div className="flex items-center gap-3">
              <input id="unitDays" type="number"
                className="flex-1 bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium text-sm"
                placeholder="15"
                value={form.accessDays}
                onChange={e => setForm({ ...form, accessDays: e.target.value })}
                min={1} max={365} />
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A5043]/60 shrink-0">
                <Lock size={12} /> days
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 pl-1">Access expires this many days after payment approval.</p>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-3">
            {[
              { id: 'isFree', label: 'Free Unit (no payment)', field: 'isFree' },
              { id: 'isPublished', label: 'Publish immediately', field: 'isPublished' },
            ].map(({ id, label, field }) => (
              <label key={id} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox"
                    checked={form[field as keyof typeof form] as boolean}
                    onChange={e => setForm({ ...form, [field]: e.target.checked })}
                    className="appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-[#27187e] checked:border-[#27187e] transition-colors cursor-pointer" />
                  <CheckCircle size={13} className={`absolute text-white pointer-events-none transition-opacity ${form[field as keyof typeof form] ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <span className="font-semibold text-sm text-[#4A5043] group-hover:text-[#27187e] transition-colors">{label}</span>
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

      <div className="pt-4 border-t border-gray-100">
        <button type="submit"
          className="bg-[#27187e] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-[#27187e]/20 transition-all disabled:opacity-60 disabled:hover:scale-100 text-sm"
          disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating Unit...</> : <><CheckCircle size={16} /> Create Unit</>}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2, AlertCircle, CheckCircle, ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English', 'Urdu', 'General']
const LEVELS = ['9th Class', '10th Class', '11th Class', '12th Class']

export default function NewCoursePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    category: 'Physics',
    level: '9th Class',
    price: '',
    isFree: false,
    isPublished: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const sigRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'maqbool-academy/thumbnails', resource_type: 'image' }),
      })
      const sigJson = await sigRes.json()
      const sig = sigJson?.data
      if (!sig) throw new Error('No signature')

      const fd = new FormData()
      fd.append('file', file)
      fd.append('api_key', sig.apiKey)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('signature', sig.signature)
      fd.append('folder', sig.folder)

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (uploadData.secure_url) {
        setForm(f => ({ ...f, thumbnail: uploadData.secure_url as string }))
      } else throw new Error('Upload failed')
    } catch {
      setError('Thumbnail upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create course'); return }
      router.push(`/admin/courses/${data.data._id as string}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/admin/courses"
        className="inline-flex items-center gap-2 text-[#4A5043] hover:text-[#27187e] font-semibold text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#27187e] flex items-center gap-3">
          <BookOpen size={28} /> Create New Course
        </h1>
        <p className="text-[#4A5043]/70 mt-2">A Course is what students purchase. Add chapters inside it after creating it.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              {/* Title */}
              <div>
                <label className="block text-[#27187e] font-bold mb-2 text-sm uppercase tracking-wider" htmlFor="ct">Course Title *</label>
                <input id="ct" type="text" placeholder="e.g. Complete Physics for 10th Class"
                  className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  required minLength={3} />
              </div>

              {/* Category + Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#27187e] font-bold mb-2 text-sm uppercase tracking-wider" htmlFor="cc">Subject</label>
                  <select id="cc"
                    className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-3 outline-none text-[#4A5043] font-medium"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#27187e] font-bold mb-2 text-sm uppercase tracking-wider" htmlFor="cl">Class</label>
                  <select id="cl"
                    className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-3 outline-none text-[#4A5043] font-medium"
                    value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-[#27187e] font-bold mb-2 text-sm uppercase tracking-wider" htmlFor="cp">Full Course Price (PKR) *</label>
                <input id="cp" type="number" placeholder="e.g. 1500"
                  className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-[#4A5043] font-medium"
                  value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  min={0} required />
                <p className="text-xs text-gray-400 mt-1">Students pay this to unlock all chapters inside.</p>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col gap-3">
                {[
                  { id: 'isFree', label: 'Free Course (no payment needed)', field: 'isFree' },
                  { id: 'isPublished', label: 'Publish immediately', field: 'isPublished' },
                ].map(({ id, label, field }) => (
                  <label key={id} className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox"
                        checked={form[field as keyof typeof form] as boolean}
                        onChange={e => setForm({ ...form, [field]: e.target.checked })}
                        className="appearance-none w-6 h-6 border-2 border-gray-300 rounded-md checked:bg-[#27187e] checked:border-[#27187e] transition-colors cursor-pointer" />
                      <CheckCircle size={14} className={`absolute inset-0 m-auto text-white pointer-events-none transition-opacity ${form[field as keyof typeof form] ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    <span className="font-semibold text-[#4A5043]">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-[#27187e] font-bold mb-2 text-sm uppercase tracking-wider">Course Thumbnail</label>
              <div className="aspect-video bg-[#f7f7ff] rounded-xl border-2 border-dashed border-[#27187e]/20 relative overflow-hidden group hover:border-[#27187e]/50 transition-colors flex items-center justify-center">
                {form.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.thumbnail} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-[#4A5043]/40">
                    <BookOpen size={40} className="mx-auto mb-2" />
                    <p className="text-sm">Upload thumbnail</p>
                  </div>
                )}
                <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                  form.thumbnail ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <input type="file" accept="image/*" id="thumbFile" className="hidden" onChange={handleThumbnailUpload} />
                  <label htmlFor="thumbFile"
                    className="bg-white text-[#27187e] px-5 py-2.5 rounded-xl font-bold cursor-pointer shadow-lg flex items-center gap-2">
                    {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Browse</>}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#27187e] font-bold mb-2 text-sm uppercase tracking-wider" htmlFor="cd">Description *</label>
            <textarea id="cd" rows={4}
              placeholder="Describe what students will learn in this course..."
              className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400 resize-y"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              required minLength={10} />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2 font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <button type="submit"
              className="bg-[#27187e] text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 hover:shadow-lg transition-all disabled:opacity-70 disabled:hover:scale-100"
              disabled={loading || uploading}>
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Creating...</>
                : <><CheckCircle size={18} /> Create Course</>}
            </button>
            <Link href="/admin/courses" className="text-[#4A5043] font-bold px-6 py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

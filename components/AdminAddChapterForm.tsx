'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle, Upload, Video } from 'lucide-react'

interface AdminAddChapterFormProps {
  courseId: string
  nextOrder: number
}

export default function AdminAddChapterForm({ courseId, nextOrder }: AdminAddChapterFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    isFree: false,
    isPublished: false,
  })
  const [videoUrl, setVideoUrl] = useState('')
  const [publicId, setPublicId] = useState('')
  const [duration, setDuration] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      // Get upload signature from server
      const sigRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'maqbool-academy/chapters', resource_type: 'video' }),
      })
      const { data: sig } = await sigRes.json()
      if (!sig) throw new Error('Could not get upload signature')

      // Cloudinary chunked upload — 50MB chunks, safe for 2+ hour videos
      const CHUNK_SIZE = 50 * 1024 * 1024 // 50MB
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      const uniqueUploadId = `maqbool-${Date.now()}-${Math.random().toString(36).slice(2)}`
      let resultData: any = null

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        const fd = new FormData()
        fd.append('file', chunk)
        fd.append('api_key', sig.apiKey)
        fd.append('timestamp', String(sig.timestamp))
        fd.append('signature', sig.signature)
        fd.append('folder', sig.folder)
        if (sig.type) fd.append('type', sig.type)

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              // Overall progress = chunks done + current chunk progress
              const chunkProgress = ev.loaded / ev.total
              const overall = ((chunkIndex + chunkProgress) / totalChunks) * 100
              setUploadProgress(Math.round(overall))
            }
          }
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
              resultData = JSON.parse(xhr.responseText)
              resolve()
            } else {
              reject(new Error(`Chunk ${chunkIndex + 1} failed: ${xhr.status}`))
            }
          }
          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`)
          // Required headers for chunked upload
          xhr.setRequestHeader('X-Unique-Upload-Id', uniqueUploadId)
          xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${file.size}`)
          xhr.send(fd)
        })
      }

      if (resultData) {
        setVideoUrl(resultData.secure_url)
        setPublicId(resultData.public_id)
        if (resultData.duration) setDuration(String(Math.ceil(resultData.duration / 60)))
      }
    } catch (err: any) {
      setError(err?.message || 'Video upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: form.title,
          description: form.description,
          price: parseFloat(form.price) || 0,
          order: nextOrder,
          isFree: form.isFree,
          isPublished: form.isPublished,
          videoUrl,
          ...(publicId ? { cloudinaryPublicId: publicId } : {}),
          ...(videoUrl ? { videoProvider: 'cloudinary' } : {}),
          duration: (parseInt(duration) || 0) * 60,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create chapter'); return }

      setSuccess(true)
      setForm({ title: '', description: '', price: '', isFree: false, isPublished: false })
      setVideoUrl('')
      setPublicId('')
      setDuration('')
      
      // Delay before redirecting to allow user to see success message
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-100 flex items-center gap-2 font-medium">
          <CheckCircle size={18} /> Chapter created! Scroll up to see it.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-5">
          {/* Title */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider" htmlFor="chTitle">Chapter Title *</label>
            <input id="chTitle" type="text" placeholder="e.g. Chapter 1: Forces & Motion"
              className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              required minLength={3} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider" htmlFor="chDesc">Description</label>
            <textarea id="chDesc" rows={2}
              placeholder="What topics does this chapter cover?"
              className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400 resize-y"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Price */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider" htmlFor="chPrice">Chapter Price (PKR) *</label>
            <input id="chPrice" type="number"
              className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium"
              placeholder="e.g. 500" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} min={0} required />
            <p className="text-[10px] text-gray-400 mt-1 pl-1">Students pay this to unlock all lectures inside this chapter.</p>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col justify-end gap-3 py-1">
            {[
              { id: 'isFree', label: 'Free Preview Chapter', field: 'isFree' },
              { id: 'isPublished', label: 'Publish Immediately', field: 'isPublished' },
            ].map(({ id, label, field }) => (
              <label key={id} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox"
                    checked={form[field as keyof typeof form] as boolean}
                    onChange={(e) => setForm({ ...form, [field]: e.target.checked })}
                    className="appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-[#27187e] checked:border-[#27187e] transition-colors cursor-pointer" />
                  <CheckCircle size={14} className={`absolute text-white pointer-events-none transition-opacity ${form[field as keyof typeof form] ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <span className="font-semibold text-sm text-[#4A5043] group-hover:text-[#27187e] transition-colors">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Video Upload */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Chapter Video</label>
            <div className="bg-[#f7f7ff] rounded-xl border-2 border-dashed border-[#27187e]/20 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden hover:border-[#27187e]/50 transition-colors h-[180px]">
              {videoUrl ? (
                <div className="flex flex-col items-center gap-2 text-green-600 py-2">
                  <CheckCircle size={40} />
                  <span className="font-bold text-lg">Video Ready!</span>
                  <button type="button" onClick={() => { setVideoUrl(''); setPublicId(''); setDuration('') }}
                    className="text-xs text-red-400 underline mt-1">Replace video</button>
                </div>
              ) : (
                <>
                  <Video size={36} className="text-[#27187e]/20 mb-3" />
                  <p className="text-[#4A5043]/60 text-sm mb-4">Upload chapter video</p>
                  <input
                    type="file"
                    accept="video/*"
                    id="newChapterVideo"
                    className="hidden"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="newChapterVideo"
                    className="bg-[#27187e] text-white px-5 py-2 rounded-xl font-bold cursor-pointer hover:scale-105 transition-transform flex items-center gap-2 text-sm">
                    {uploading
                      ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                      : <><Upload size={16} /> Browse Video</>}
                  </label>
                </>
              )}

              {/* Progress bar */}
              {uploading && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6 rounded-xl">
                  <div className="w-16 h-16 rounded-full border-4 border-[#27187e]/20 border-t-[#27187e] animate-spin mb-4" />
                  <span className="text-[#27187e] font-black text-3xl mb-1">{uploadProgress}%</span>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-gradient-to-r from-[#27187e] to-[#4361ee] transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-[#27187e]/60 text-xs font-semibold text-center leading-snug">
                    Uploading in chunks — safe for large videos<br/>
                    <span className="text-red-400 font-bold">Do not close this tab!</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Duration (Minutes)</label>
            <input type="number" placeholder="Auto-filled on upload"
              className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium"
              value={duration} onChange={(e) => setDuration(e.target.value)} min={0} />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2 font-medium">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <button type="submit"
          className="bg-[#27187e] text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 hover:shadow-lg transition-all disabled:opacity-70 disabled:hover:scale-100"
          disabled={loading || uploading}>
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Creating Chapter...</>
            : <><CheckCircle size={18} /> Create Chapter</>}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle, Upload, Video, X } from 'lucide-react'

interface AdminAddTopicFormProps {
  unitId: string
  courseId: string
  nextOrder: number
  existingCount: number
  onClose?: () => void
}

export default function AdminAddTopicForm({
  unitId,
  courseId,
  nextOrder,
  existingCount,
  onClose,
}: AdminAddTopicFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    isPublished: false,
  })
  const [videoUrl, setVideoUrl]       = useState('')
  const [publicId, setPublicId]       = useState('')
  const [duration, setDuration]       = useState('')
  const [uploading, setUploading]     = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)

  const MAX_TOPICS = 30
  const remaining = MAX_TOPICS - existingCount

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      const sigRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'zanrosh-academy/topics', resource_type: 'video' }),
      })
      const { data: sig } = await sigRes.json()
      if (!sig) throw new Error('Could not get upload signature')

      const CHUNK = 50 * 1024 * 1024
      const totalChunks = Math.ceil(file.size / CHUNK)
      const uid = `zanrosh-${Date.now()}-${Math.random().toString(36).slice(2)}`
      let resultData: any = null

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK
        const end   = Math.min(start + CHUNK, file.size)
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
              const overall = ((i + ev.loaded / ev.total) / totalChunks) * 100
              setUploadProgress(Math.round(overall))
            }
          }
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
              resultData = JSON.parse(xhr.responseText)
              resolve()
            } else reject(new Error(`Chunk ${i + 1} failed: ${xhr.status}`))
          }
          xhr.onerror = () => reject(new Error('Network error'))
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`)
          xhr.setRequestHeader('X-Unique-Upload-Id', uid)
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
    if (existingCount >= MAX_TOPICS) { setError('Maximum 30 topics per unit reached.'); return }
    setError(''); setSuccess(false); setLoading(true)

    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          courseId,
          title: form.title,
          description: form.description,
          videoUrl,
          ...(publicId ? { cloudinaryPublicId: publicId } : {}),
          ...(videoUrl ? { videoProvider: 'cloudinary' } : {}),
          duration: (parseInt(duration) || 0) * 60,
          order: nextOrder,
          isPublished: form.isPublished,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create topic'); return }

      setSuccess(true)
      setForm({ title: '', description: '', isPublished: false })
      setVideoUrl(''); setPublicId(''); setDuration('')

      setTimeout(() => {
        router.refresh()
        if (onClose) onClose()
      }, 800)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-[#27187e]/10 rounded-2xl p-6 relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
      )}

      <h4 className="font-black text-[#27187e] text-base mb-1 flex items-center gap-2">
        <Video size={16} className="text-[#3a86ff]" /> Add Topic
        <span className="ml-auto text-xs font-bold text-gray-400">{existingCount}/{MAX_TOPICS} topics</span>
      </h4>
      {remaining <= 5 && (
        <p className="text-amber-400 text-xs font-bold mb-4">
          ⚠ Only {remaining} topic slot{remaining !== 1 ? 's' : ''} remaining
        </p>
      )}

      {success && (
        <div className="bg-emerald-500/10 text-emerald-400 px-4 py-3 rounded-xl border border-emerald-500/20 flex items-center gap-2 font-medium text-sm mb-4">
          <CheckCircle size={16} /> Topic created!
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Topic Title *</label>
              <input
                type="text"
                placeholder="e.g. Newton's First Law"
                className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400 text-sm"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required minLength={2}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Description</label>
              <textarea
                rows={3}
                placeholder="What will students learn?"
                className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400 resize-y text-sm"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Publish */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={e => setForm({ ...form, isPublished: e.target.checked })}
                  className="appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-[#27187e] checked:border-[#27187e] transition-colors cursor-pointer"
                />
                <CheckCircle size={13} className={`absolute text-white pointer-events-none transition-opacity ${form.isPublished ? 'opacity-100' : 'opacity-0'}`} />
              </div>
              <span className="font-semibold text-sm text-[#4A5043] group-hover:text-[#27187e] transition-colors">Publish immediately</span>
            </label>
          </div>

          <div className="flex flex-col gap-4">
            {/* Video Upload */}
            <div>
              <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Topic Video *</label>
              <div className="bg-[#f7f7ff] border-2 border-dashed border-[#27187e]/20 rounded-xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden hover:border-[#27187e]/40 transition-colors h-[160px]">
                {videoUrl ? (
                  <div className="flex flex-col items-center gap-2 text-emerald-600">
                    <CheckCircle size={36} />
                    <span className="font-bold text-sm">Video Ready!</span>
                    <button type="button" onClick={() => { setVideoUrl(''); setPublicId(''); setDuration('') }}
                      className="text-xs text-red-500 underline">Replace video</button>
                  </div>
                ) : (
                  <>
                    <Video size={28} className="text-gray-300 mb-3" />
                    <p className="text-gray-400 text-xs mb-3">MP4 · MOV · up to 2 hours</p>
                    <input type="file" accept="video/*" id="newTopicVideo" className="hidden"
                      onChange={handleVideoUpload} disabled={uploading} />
                    <label htmlFor="newTopicVideo"
                      className="bg-[#3a86ff] text-white px-4 py-2 rounded-xl font-bold cursor-pointer hover:scale-105 transition-transform flex items-center gap-2 text-sm">
                      {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload Video</>}
                    </label>
                  </>
                )}

                {uploading && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl p-4">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#3a86ff] animate-spin mb-3" />
                    <span className="text-[#3a86ff] font-black text-2xl mb-1">{uploadProgress}%</span>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-gradient-to-r from-[#3a86ff] to-emerald-400 transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-gray-500 text-xs text-center">
                      Uploading in chunks<br />
                      <span className="text-red-500 font-bold">Do not close this tab!</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Duration (Minutes)</label>
              <input type="number" placeholder="Auto-filled on upload"
                className="w-full bg-[#f7f7ff] border-2 border-transparent focus:border-[#27187e] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium text-sm"
                value={duration} onChange={e => setDuration(e.target.value)} min={0} />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl border border-red-500/20 flex items-center gap-2 font-medium text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button type="submit"
            className="bg-[#27187e] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-[#27187e]/20 transition-all disabled:opacity-50 disabled:hover:scale-100 text-sm"
            disabled={loading || uploading || existingCount >= MAX_TOPICS}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><CheckCircle size={16} /> Create Topic</>}
          </button>
          {onClose && (
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-[#4A5043] hover:bg-gray-100 transition-colors text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

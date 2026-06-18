'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle, Upload, Video } from 'lucide-react'

interface AdminAddLectureFormProps {
  chapterId: string
  nextOrder: number
  onClose?: () => void
}

export default function AdminAddLectureForm({ chapterId, nextOrder, onClose }: AdminAddLectureFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
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
      const sigRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'maqbool-academy/lectures', resource_type: 'video' }),
      })
      const { data: sig } = await sigRes.json()
      if (!sig) throw new Error('Could not get upload signature')

      const fd = new FormData()
      fd.append('file', file)
      fd.append('api_key', sig.apiKey)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('signature', sig.signature)
      fd.append('folder', sig.folder)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText)
            setVideoUrl(data.secure_url)
            setPublicId(data.public_id)
            if (data.duration) setDuration(String(Math.ceil(data.duration / 60)))
            resolve()
          } else reject(new Error('Upload failed'))
        }
        xhr.onerror = () => reject(new Error('Upload error'))
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`)
        xhr.send(fd)
      })
    } catch {
      setError('Video upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl) { setError('Please upload a video first.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          title,
          description,
          videoUrl,
          cloudinaryPublicId: publicId,
          duration: (parseInt(duration) || 0) * 60,
          order: nextOrder,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to add lecture'); return }
      setSuccess(true)
      setTitle('')
      setDescription('')
      setVideoUrl('')
      setPublicId('')
      setDuration('')
      router.refresh()
      setTimeout(() => setSuccess(false), 2000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 text-green-700 px-4 py-4 rounded-xl border border-green-200 flex items-center gap-3 font-semibold">
        <CheckCircle size={20} /> Lecture added successfully!
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-[#f7f7ff]/60 rounded-2xl p-6 border border-[#27187e]/10 mt-4">
      <h4 className="font-black text-[#27187e] text-lg flex items-center gap-2">
        <Video size={20} /> Add New Lecture
      </h4>

      {/* Title */}
      <div>
        <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Lecture Title *</label>
        <input type="text" placeholder="e.g. Introduction to Newton's Laws"
          className="w-full bg-white border-2 border-transparent focus:border-[#27187e] rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400"
          value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Description</label>
        <textarea rows={2} placeholder="What will students learn in this lecture?"
          className="w-full bg-white border-2 border-transparent focus:border-[#27187e] rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400 resize-y"
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {/* Video Upload */}
      <div>
        <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Video *</label>
        <div className="bg-white rounded-xl border-2 border-dashed border-[#27187e]/20 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden hover:border-[#27187e]/50 transition-colors min-h-[160px]">
          {videoUrl ? (
            <div className="flex flex-col items-center gap-2 text-green-600 py-2">
              <CheckCircle size={40} />
              <span className="font-bold text-lg">Video Uploaded!</span>
              <span className="text-xs text-gray-400 truncate max-w-xs">{videoUrl}</span>
              <button type="button" onClick={() => { setVideoUrl(''); setPublicId(''); setDuration('') }}
                className="text-xs text-red-400 underline mt-1">Remove & re-upload</button>
            </div>
          ) : (
            <>
              <Video size={36} className="text-[#27187e]/20 mb-3" />
              <p className="text-[#4A5043]/60 text-sm mb-4">Upload lecture video directly to Cloudinary</p>
              <input
                type="file"
                accept="video/*"
                id={`lectureVideo-${chapterId}-${nextOrder}`}
                className="hidden"
                onChange={handleVideoUpload}
                disabled={uploading}
              />
              <label htmlFor={`lectureVideo-${chapterId}-${nextOrder}`}
                className="bg-[#27187e] text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer hover:scale-105 transition-transform flex items-center gap-2">
                {uploading
                  ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                  : <><Upload size={16} /> Browse Video</>}
              </label>
            </>
          )}

          {/* Progress bar & percentage */}
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0">
              <div className="flex items-center justify-center py-2 bg-[#27187e]/5">
                <span className="text-[#27187e] font-black text-xl">{uploadProgress}%</span>
                <span className="text-[#27187e]/60 text-xs ml-2">— Do not close this page</span>
              </div>
              <div className="h-2 bg-[#27187e]/10">
                <div className="h-full bg-[#27187e] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Duration (Minutes)</label>
          <input type="number" placeholder="Auto-filled on upload"
            className="w-full bg-white border-2 border-transparent focus:border-[#27187e] rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium"
            value={duration} onChange={(e) => setDuration(e.target.value)} min={0} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2 font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit"
          className="bg-[#27187e] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100"
          disabled={loading || uploading || !videoUrl}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><CheckCircle size={16} /> Save Lecture</>}
        </button>
        {onClose && (
          <button type="button" onClick={onClose}
            className="px-5 py-3 rounded-xl font-bold text-[#4A5043] hover:bg-gray-100 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

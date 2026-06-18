'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle, Upload, Video } from 'lucide-react'

interface Chapter {
  _id: string
  title: string
  description?: string
  videoUrl?: string
  duration?: number
  price: number
  isFree: boolean
  isPublished: boolean
}

interface AdminEditChapterFormProps {
  chapter: Chapter
  onClose: () => void
}

export default function AdminEditChapterForm({ chapter, onClose }: AdminEditChapterFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(chapter.title)
  const [description, setDescription] = useState(chapter.description || '')
  const [price, setPrice] = useState(chapter.price.toString())
  const [isFree, setIsFree] = useState(chapter.isFree)
  const [isPublished, setIsPublished] = useState(chapter.isPublished)
  const [videoUrl, setVideoUrl] = useState(chapter.videoUrl || '')
  const [publicId, setPublicId] = useState('')
  const [duration, setDuration] = useState(chapter.duration ? String(Math.ceil(chapter.duration / 60)) : '')
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
        body: JSON.stringify({ folder: 'maqbool-academy/chapters', resource_type: 'video' }),
      })
      const { data: sig } = await sigRes.json()
      if (!sig) throw new Error('Could not get upload signature')

      const fd = new FormData()
      fd.append('file', file)
      fd.append('api_key', sig.apiKey)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('signature', sig.signature)
      fd.append('folder', sig.folder)
      if (sig.type) fd.append('type', sig.type)

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
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/chapters/${chapter._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price) || 0,
          isFree,
          isPublished,
          videoUrl,
          ...(publicId ? { cloudinaryPublicId: publicId } : {}),
          ...(videoUrl ? { videoProvider: 'cloudinary' } : {}),
          duration: (parseInt(duration) || 0) * 60,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to update chapter'); return }
      setSuccess(true)
      router.refresh()
      setTimeout(() => onClose(), 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 text-green-700 px-4 py-4 rounded-xl border border-green-200 flex items-center gap-3 font-semibold">
        <CheckCircle size={20} /> Chapter updated successfully!
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-[#f7f7ff] rounded-2xl p-6 mt-2 relative z-10 shadow-inner border border-[#27187e]/10">
      <h4 className="font-black text-[#27187e] text-lg flex items-center gap-2">
        <Video size={20} /> Edit Chapter Details & Video
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-5">
          {/* Title */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Chapter Title *</label>
            <input type="text" placeholder="e.g. Introduction to Newton's Laws"
              className="w-full bg-white border-2 border-transparent focus:border-[#27187e] rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400"
              value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          {/* Price */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Price (PKR) *</label>
            <input type="number" placeholder="e.g. 500"
              className="w-full bg-white border-2 border-transparent focus:border-[#27187e] rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium"
              value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Description</label>
            <textarea rows={3} placeholder="What will students learn in this chapter?"
              className="w-full bg-white border-2 border-transparent focus:border-[#27187e] rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium placeholder-gray-400 resize-y"
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Flags */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} className="w-5 h-5 accent-[#27187e]" />
              <span className="font-semibold text-sm text-[#4A5043]">Free Chapter</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-5 h-5 accent-[#27187e]" />
              <span className="font-semibold text-sm text-[#4A5043]">Published</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Video Upload */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Video</label>
            <div className="bg-white rounded-xl border-2 border-dashed border-[#27187e]/20 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden hover:border-[#27187e]/50 transition-colors h-[200px]">
              {videoUrl ? (
                <div className="flex flex-col items-center gap-2 text-green-600 py-2">
                  <CheckCircle size={40} />
                  <span className="font-bold text-lg">Video Uploaded!</span>
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">{videoUrl}</span>
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
                    id={`editChapterVideo-${chapter._id}`}
                    className="hidden"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                  />
                  <label htmlFor={`editChapterVideo-${chapter._id}`}
                    className="bg-[#27187e] text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer hover:scale-105 transition-transform flex items-center gap-2">
                    {uploading
                      ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                      : <><Upload size={16} /> Browse Video</>}
                  </label>
                </>
              )}

              {/* Progress bar & percentage */}
              {uploading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6">
                  <span className="text-[#27187e] font-black text-3xl mb-2">{uploadProgress}%</span>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#27187e] transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-[#27187e]/60 text-xs mt-3 font-semibold text-center leading-tight">Please keep this page open<br/>until upload completes.</span>
                </div>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[#27187e] font-bold mb-1.5 text-xs uppercase tracking-wider">Duration (Minutes)</label>
            <input type="number" placeholder="Auto-filled on upload"
              className="w-full bg-white border-2 border-transparent focus:border-[#27187e] rounded-xl px-4 py-2.5 outline-none transition-all text-[#4A5043] font-medium"
              value={duration} onChange={(e) => setDuration(e.target.value)} min={0} />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2 font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit"
          className="bg-[#27187e] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100"
          disabled={loading || uploading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><CheckCircle size={16} /> Save Changes</>}
        </button>
        <button type="button" onClick={onClose}
          className="px-5 py-3 rounded-xl font-bold text-[#4A5043] hover:bg-gray-200 bg-gray-100 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

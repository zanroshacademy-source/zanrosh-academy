'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Globe, EyeOff, Trash2 } from 'lucide-react'

interface Props {
  courseId: string
  isPublished: boolean
}

export default function AdminCourseActions({ courseId, isPublished }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const togglePublish = async () => {
    setError('')
    setLoading('publish')
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      router.refresh()
    } catch { setError('Network error') }
    finally { setLoading(null) }
  }

  const deleteCourse = async () => {
    if (!confirm('Delete this course and ALL its chapters? This cannot be undone.')) return
    setError('')
    setLoading('delete')
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' })
      if (!res.ok) { setError('Delete failed'); return }
      router.push('/admin/courses')
    } catch { setError('Network error') }
    finally { setLoading(null) }
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {error && <span className="text-red-500 text-sm flex items-center gap-1"><AlertCircle size={13} /> {error}</span>}
      <div className="flex gap-2">
        <button
          onClick={togglePublish}
          disabled={!!loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            isPublished
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {loading === 'publish'
            ? <Loader2 size={15} className="animate-spin" />
            : isPublished ? <><EyeOff size={15} /> Unpublish</> : <><Globe size={15} /> Publish</>}
        </button>
        <button
          onClick={deleteCourse}
          disabled={!!loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-all"
        >
          {loading === 'delete'
            ? <Loader2 size={15} className="animate-spin" />
            : <><Trash2 size={15} /> Delete</>}
        </button>
      </div>
    </div>
  )
}

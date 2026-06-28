'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Unlock, Clock, Edit, Trash2, Loader2 } from 'lucide-react'
import { formatPKR, formatDuration } from '@/lib/utils'
import AdminEditChapterForm from '@/components/AdminEditChapterForm'

interface Chapter {
  _id: string
    title: string
  description?: string
  price: number
  isFree: boolean
  isPublished: boolean
  order: number
  videoUrl?: string
  duration?: number
}

interface Props {
    chapters: Chapter[]
}

export default function AdminCourseChapters({ chapters }: Props) {
  const router = useRouter()
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [deletingChapter, setDeletingChapter] = useState<string | null>(null)

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) return
    setDeletingChapter(chapterId)
    try {
      const res = await fetch(`/api/chapters/${chapterId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.refresh()
    } catch {
      alert('Error deleting chapter.')
    } finally {
      setDeletingChapter(null)
    }
  }

  if (chapters.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-500 font-medium mb-8">
        No chapters yet. Use the form below to create your first chapter.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {chapters.map((ch, idx) => {
        if (editingChapter === ch._id) {
          return (
            <AdminEditChapterForm 
              key={ch._id}
              chapter={ch} 
              onClose={() => setEditingChapter(null)} 
            />
          )
        }

        return (
          <div key={ch._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex items-center p-4 hover:bg-[#f7f7ff]/50 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-[#27187e]/10 flex items-center justify-center text-[#27187e] font-black shrink-0 mr-4">
              {idx + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-bold text-[#27187e] text-lg leading-tight">{ch.title}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ch.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {ch.isPublished ? 'Published' : 'Draft'}
                </span>
                {ch.isFree && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Free Preview</span>}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-[#4A5043]">
                {ch.duration && ch.duration > 0 && (
                  <span className="flex items-center gap-1"><Clock size={13} className="opacity-60" /> {formatDuration(ch.duration)}</span>
                )}
                {ch.videoUrl ? (
                  <span className="flex items-center gap-1 text-green-600"><Unlock size={13} /> Video ready</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400"><Lock size={13} /> No video</span>
                )}
                <span className="font-bold text-[#27187e]">
                  {ch.isFree ? 'FREE' : formatPKR(ch.price)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-4 border-l border-gray-100 ml-4">
              <button 
                onClick={() => setEditingChapter(ch._id)}
                className="flex items-center gap-2 px-4 py-2 text-[#4A5043] font-bold text-sm hover:text-[#27187e] hover:bg-[#27187e]/5 rounded-xl transition-colors"
                title="Edit Chapter"
              >
                <Edit size={16} /> Edit
              </button>
              <button 
                onClick={() => handleDeleteChapter(ch._id)}
                disabled={deletingChapter === ch._id}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete Chapter"
              >
                {deletingChapter === ch._id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

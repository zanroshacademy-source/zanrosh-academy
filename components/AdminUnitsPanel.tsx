'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronRight, Edit, Trash2, Plus, Video,
  CheckCircle, Clock, Globe, EyeOff, Lock, Loader2, PlayCircle
} from 'lucide-react'
import { formatPKR, formatDuration } from '@/lib/utils'
import AdminAddTopicForm from '@/components/AdminAddTopicForm'
import AdminEditChapterForm from '@/components/AdminEditChapterForm'

interface Topic {
  _id: string
  unitId: string
  courseId: string
  title: string
  description?: string
  videoUrl?: string
  duration?: number
  order: number
  isPublished: boolean
}

interface Unit {
  _id: string
  courseId: string
  title: string
  description?: string
  price: number
  accessDays: number
  isFree: boolean
  isPublished: boolean
  order: number
  topics: Topic[]
}

interface Props {
  units: Unit[]
  courseId: string
}

export default function AdminUnitsPanel({ units, courseId }: Props) {
  const router = useRouter()
  const [openUnit, setOpenUnit]           = useState<string | null>(units[0]?._id ?? null)
  const [editingUnit, setEditingUnit]     = useState<string | null>(null)
  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null)
  const [deletingUnit, setDeletingUnit]   = useState<string | null>(null)
  const [deletingTopic, setDeletingTopic] = useState<string | null>(null)
  const [editingTopic, setEditingTopic]   = useState<string | null>(null)

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Delete this unit? All topics inside will also be deleted. This cannot be undone.')) return
    setDeletingUnit(unitId)
    try {
      await fetch(`/api/chapters/${unitId}`, { method: 'DELETE' })
      router.refresh()
    } catch { alert('Error deleting unit') }
    finally { setDeletingUnit(null) }
  }

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Delete this topic? This cannot be undone.')) return
    setDeletingTopic(topicId)
    try {
      await fetch(`/api/topics/${topicId}`, { method: 'DELETE' })
      router.refresh()
    } catch { alert('Error deleting topic') }
    finally { setDeletingTopic(null) }
  }

  const toggleTopicPublish = async (topic: Topic) => {
    try {
      await fetch(`/api/topics/${topic._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !topic.isPublished }),
      })
      router.refresh()
    } catch { alert('Error updating topic') }
  }

  if (units.length === 0) {
    return (
      <div className="bg-[#f7f7ff] border-2 border-dashed border-[#27187e]/10 rounded-3xl p-12 text-center">
        <div className="w-16 h-16 bg-[#27187e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <PlayCircle size={32} className="text-[#27187e]/40" />
        </div>
        <p className="text-[#4A5043]/60 font-medium">No units yet. Use the form below to create your first unit.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {units.map((unit, uIdx) => {
        const isOpen    = openUnit === unit._id
        const isEditing = editingUnit === unit._id

        if (isEditing) {
          return (
            <div key={unit._id} className="bg-white rounded-2xl border border-[#27187e]/20 shadow-sm overflow-hidden">
              <div className="p-5">
                <AdminEditChapterForm chapter={unit as any} onClose={() => { setEditingUnit(null); router.refresh() }} />
              </div>
            </div>
          )
        }

        return (
          <div key={unit._id} className="bg-white rounded-2xl border border-[#27187e]/10 shadow-sm overflow-hidden transition-all">
            {/* ── Unit Header Row ────────────────────────────────── */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#f7f7ff]/60 transition-colors"
              onClick={() => setOpenUnit(isOpen ? null : unit._id)}
            >
              {/* Number badge */}
              <div className="w-10 h-10 rounded-xl bg-[#27187e] text-white font-black flex items-center justify-center text-sm shrink-0">
                {uIdx + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-black text-[#27187e] text-base leading-tight">{unit.title}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    unit.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {unit.isPublished ? <><Globe size={10} className="inline mr-1" />Published</> : <><EyeOff size={10} className="inline mr-1" />Draft</>}
                  </span>
                  {unit.isFree && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">FREE</span>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#4A5043]/70 font-medium">
                  <span className="font-black text-[#27187e]">{unit.isFree ? 'FREE' : formatPKR(unit.price)}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{unit.accessDays ?? 15} days access</span>
                  <span className="flex items-center gap-1"><Video size={11} />{unit.topics.length}/30 topics</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => setEditingUnit(unit._id)}
                  className="p-2 text-[#4A5043] hover:text-[#27187e] hover:bg-[#27187e]/5 rounded-lg transition-colors"
                  title="Edit Unit">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteUnit(unit._id)}
                  disabled={deletingUnit === unit._id}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Unit">
                  {deletingUnit === unit._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
                {isOpen ? <ChevronDown size={18} className="text-[#27187e]/40" /> : <ChevronRight size={18} className="text-[#27187e]/40" />}
              </div>
            </div>

            {/* ── Topics Section (expanded) ─────────────────────── */}
            {isOpen && (
              <div className="border-t border-[#27187e]/5 bg-[#f7f7ff]/50">
                <div className="p-4">
                  {unit.topics.length === 0 ? (
                    <div className="text-center py-6 text-[#4A5043]/40">
                      <Video size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">No topics yet. Add your first topic below.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mb-4">
                      {unit.topics.map((topic, tIdx) => (
                        <div key={topic._id}>
                          {editingTopic === topic._id ? (
                            <div className="bg-white rounded-xl border border-[#27187e]/10 p-4">
                              {/* Simple inline edit for topic */}
                              <TopicEditInline
                                topic={topic}
                                onClose={() => { setEditingTopic(null); router.refresh() }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-[#27187e]/20 transition-colors group">
                              {/* Topic number */}
                              <div className="w-7 h-7 rounded-lg bg-[#27187e]/10 text-[#27187e] font-black text-xs flex items-center justify-center shrink-0">
                                {tIdx + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="font-bold text-[#27187e] text-sm truncate">{topic.title}</p>
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                    topic.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {topic.isPublished ? 'Live' : 'Draft'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[#4A5043]/50">
                                  {topic.videoUrl ? (
                                    <span className="flex items-center gap-1 text-emerald-600">
                                      <CheckCircle size={11} /> Video ready
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-red-400">
                                      <Lock size={11} /> No video
                                    </span>
                                  )}
                                  {topic.duration && topic.duration > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Clock size={11} />{formatDuration(topic.duration)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Topic actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => toggleTopicPublish(topic)}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    topic.isPublished
                                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  }`}
                                  title={topic.isPublished ? 'Unpublish' : 'Publish'}
                                >
                                  {topic.isPublished ? <EyeOff size={12} /> : <Globe size={12} />}
                                </button>
                                <button onClick={() => setEditingTopic(topic._id)}
                                  className="p-1.5 text-[#4A5043] hover:text-[#27187e] hover:bg-[#27187e]/5 rounded-lg transition-colors">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDeleteTopic(topic._id)}
                                  disabled={deletingTopic === topic._id}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  {deletingTopic === topic._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add topic button / form */}
                  {addingTopicTo === unit._id ? (
                    <AdminAddTopicForm
                      unitId={unit._id}
                      courseId={courseId}
                      nextOrder={unit.topics.length + 1}
                      existingCount={unit.topics.length}
                      onClose={() => setAddingTopicTo(null)}
                    />
                  ) : (
                    unit.topics.length < 30 && (
                      <button
                        onClick={() => setAddingTopicTo(unit._id)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#27187e]/15 text-[#27187e]/50 hover:border-[#27187e]/40 hover:text-[#27187e] hover:bg-white/50 transition-all font-bold text-sm"
                      >
                        <Plus size={16} /> Add Topic ({unit.topics.length}/30)
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Inline topic edit form ─────────────────────────────────────────────────
function TopicEditInline({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const [title, setTitle]           = useState(topic.title)
  const [description, setDescription] = useState(topic.description ?? '')
  const [isPublished, setIsPublished] = useState(topic.isPublished)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/topics/${topic._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, isPublished }),
      })
      if (!res.ok) throw new Error('Failed to update')
      onClose()
    } catch { setError('Update failed') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-3">
      <h4 className="font-black text-[#27187e] text-sm flex items-center gap-2"><Edit size={14} /> Edit Topic</h4>
      <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
        className="w-full bg-[#f7f7ff] border border-[#27187e]/10 focus:border-[#27187e]/40 rounded-xl px-3 py-2 outline-none text-[#27187e] font-bold text-sm" />
      <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
        className="w-full bg-[#f7f7ff] border border-[#27187e]/10 rounded-xl px-3 py-2 outline-none text-[#4A5043] text-sm resize-none" />
      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#4A5043]">
        <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="accent-[#27187e]" />
        Published
      </label>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="bg-[#27187e] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onClose}
          className="px-4 py-2 rounded-xl font-bold text-xs text-[#4A5043] hover:bg-gray-100 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

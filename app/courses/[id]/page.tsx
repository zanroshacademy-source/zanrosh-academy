import { DEV_MODE, DEV_USER } from '@/lib/dev-mode'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Topic from '@/models/Topic'
import Purchase from '@/models/Purchase'
import Link from 'next/link'
import {
  BookOpen, Lock, Unlock, Video,
  PlayCircle, Clock,
  AlertCircle, CheckCircle, ChevronRight
} from 'lucide-react'
import { formatPKR, formatDuration } from '@/lib/utils'
import { notFound } from 'next/navigation'
import mongoose from 'mongoose'

function safeToIsoString(d: any): string | null {
  if (!d) return null
  try {
    const date = new Date(d)
    return isNaN(date.getTime()) ? null : date.toISOString()
  } catch {
    return null
  }
}

async function getCourseData(id: string, userId: string | null) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null

  await connectDB()
  let course = await Course.findById(id).lean()

  // If id is a Chapter ID, resolve to its parent Course
  if (!course) {
    const ch = await Chapter.findById(id).select('courseId').lean()
    if (ch?.courseId) {
      course = await Course.findById(ch.courseId).lean()
    }
  }

  // If id is a Topic ID, resolve to its parent Course
  if (!course) {
    const tp = await Topic.findById(id).select('courseId').lean()
    if (tp?.courseId) {
      course = await Course.findById(tp.courseId).lean()
    }
  }

  if (!course) return null

  // Load units for this course
  const units = await Chapter.find({ courseId: course._id }).sort({ order: 1 }).lean()

  // Load all topics for every unit in one query (using real admin data from DB)
  const allTopics = await Topic.find({
    unitId: { $in: units.map(u => u._id) },
  })
    .sort({ order: 1 })
    .select('_id title description duration order unitId price isFree accessDays isPublished')
    .lean()

  const topicsByUnit = new Map<string, typeof allTopics>()
  allTopics.forEach((t: any) => {
    const key = t.unitId.toString()
    if (!topicsByUnit.has(key)) topicsByUnit.set(key, [])
    topicsByUnit.get(key)!.push(t)
  })

  let isFullCoursePurchased = false
  const purchasedUnitIds = new Map<string, Date | null>()
  const purchasedTopicIds = new Map<string, Date | null>()

  if (userId) {
    const auth = await import('@/lib/auth')
    if (await auth.isSuperAdmin()) {
      isFullCoursePurchased = true
    } else {
      const [coursePurchase, unitPurchases, topicPurchases] = await Promise.all([
        Purchase.findOne({ userId, courseId: id, status: 'approved' }).lean(),
        Purchase.find({
          userId,
          chapterId: { $in: units.map(u => u._id) },
          status: 'approved',
        }).lean() as Promise<any[]>,
        Purchase.find({
          userId,
          topicId: { $in: allTopics.map(t => t._id) },
          status: 'approved',
        }).lean() as Promise<any[]>,
      ])

      if (coursePurchase) {
        isFullCoursePurchased = true
      }

      unitPurchases.forEach((p: any) => {
        if (p.chapterId) {
          purchasedUnitIds.set(p.chapterId.toString(), p.expiresAt ?? null)
        }
      })

      topicPurchases.forEach((p: any) => {
        if (p.topicId) {
          purchasedTopicIds.set(p.topicId.toString(), p.expiresAt ?? null)
        }
      })
    }
  }

  return {
    course: { ...course, _id: course._id.toString() },
    units: units.map((u: any) => ({
      ...u,
      _id: u._id.toString(),
      courseId: u.courseId.toString(),
      topics: (topicsByUnit.get(u._id.toString()) ?? []).map((t: any) => ({
        ...t,
        _id: t._id.toString(),
        unitId: u._id.toString(),
      })),
    })),
    isFullCoursePurchased,
    purchasedUnits: Object.fromEntries(
      Array.from(purchasedUnitIds.entries()).map(([k, v]) => [k, safeToIsoString(v)])
    ),
    purchasedTopics: Object.fromEntries(
      Array.from(purchasedTopicIds.entries()).map(([k, v]) => [k, safeToIsoString(v)])
    ),
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let userId: string | null = null
  if (DEV_MODE) {
    userId = DEV_USER.userId
  } else {
    const { auth } = await import('@clerk/nextjs/server')
    const session = await auth()
    userId = session.userId
  }

  try {
    const data = await getCourseData(id, userId)
    if (!data) notFound()

    const { course, units, isFullCoursePurchased, purchasedUnits, purchasedTopics } = data

    return (
      <div className="min-h-screen bg-[#f7f7ff]">

        {/* ── Course Hero ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden py-16 px-4 border-b border-[#27187e]/10 bg-white">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="bg-[#27187e]/5 border border-[#27187e]/10 text-[#27187e] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <BookOpen size={12} /> {(course as any).category || 'General'}
                </span>
                <span className="bg-[#27187e]/5 border border-[#27187e]/10 text-[#27187e] text-xs font-bold px-3 py-1.5 rounded-full">
                  Class: {(course as any).level || 'General'}
                </span>
                <span className="bg-[#3a86ff]/10 border border-[#3a86ff]/20 text-[#3a86ff] text-xs font-bold px-3 py-1.5 rounded-full">
                  {units.length} Unit{units.length !== 1 ? 's' : ''}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-[#27187e] mb-5 leading-tight">{course.title}</h1>
              <p className="text-[#4A5043]/70 text-lg leading-relaxed max-w-2xl">{course.description}</p>
            </div>

            {(course as any).thumbnail && (
              <div className="w-full md:w-72 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-[#27187e]/10 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={(course as any).thumbnail} alt={course.title} className="w-full aspect-video object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* ── Units & Topics List ────────────────────────────────────── */}
        <main className="max-w-4xl mx-auto px-4 py-10 pb-20">
          <h2 className="text-2xl font-black text-[#27187e] mb-2">Course Topics</h2>
          <p className="text-[#4A5043]/60 text-sm font-medium mb-6">
            Buy and unlock individual topics directly. Watch anytime during your access period.
          </p>

          <div className="flex flex-col gap-6">
            {units.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#27187e]/10 shadow-sm">
                <AlertCircle size={40} className="mx-auto mb-4 text-[#27187e]/20" />
                <p className="text-[#4A5043]/60 font-medium">No units published yet.</p>
              </div>
            )}

            {units.map((unit: any, idx: number) => {
              const unitExpiresAtStr = purchasedUnits[unit._id]
              const isUnitPurchased = isFullCoursePurchased || unit._id in purchasedUnits
              const unitExpiresAt = unitExpiresAtStr ? new Date(unitExpiresAtStr) : null
              const isUnitExpired = unitExpiresAt ? unitExpiresAt < new Date() : false

              return (
                <UnitSection
                  key={unit._id}
                  unit={unit}
                  idx={idx}
                  isUnitPurchased={isUnitPurchased && !isUnitExpired}
                  isFullCoursePurchased={isFullCoursePurchased}
                  purchasedTopics={purchasedTopics}
                  userId={userId}
                />
              )
            })}
          </div>
        </main>
      </div>
    )
  } catch (err: any) {
    return (
      <div className="p-10 min-h-screen bg-red-50 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black text-red-600 mb-4">Error loading course</h1>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200 max-w-4xl w-full overflow-auto">
          <p className="font-bold text-red-800 mb-2">Message:</p>
          <pre className="text-sm text-red-700 whitespace-pre-wrap">{err.message}</pre>
        </div>
      </div>
    )
  }
}

// ── Unit Section with Topics ──────────────────────────────────────────
function UnitSection({
  unit,
  idx,
  isUnitPurchased,
  isFullCoursePurchased,
  purchasedTopics,
  userId,
}: {
  unit: any
  idx: number
  isUnitPurchased: boolean
  isFullCoursePurchased: boolean
  purchasedTopics: Record<string, string | null>
  userId: string | null
}) {
  const totalTopics = unit.topics.length
  const totalDuration = unit.topics.reduce((a: number, t: any) => a + (t.duration ?? 0), 0)

  // Count how many topics are unlocked
  const unlockedCount = unit.topics.filter((t: any) => {
    if (unit.isFree || t.isFree || isFullCoursePurchased || isUnitPurchased) return true
    const expStr = purchasedTopics[t._id]
    if (expStr) {
      const exp = new Date(expStr)
      return exp >= new Date()
    }
    return false
  }).length

  return (
    <div className="bg-white border border-[#27187e]/10 shadow-sm rounded-3xl overflow-hidden transition-all">
      {/* Unit header */}
      <div className="flex items-center justify-between gap-4 p-5 bg-[#f7f7ff]/70 border-b border-[#27187e]/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#27187e] text-white flex items-center justify-center font-black text-sm shrink-0">
            {idx + 1}
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-[#27187e] text-lg leading-tight truncate">{unit.title}</h3>
            <div className="flex items-center gap-3 text-xs text-[#4A5043]/60 font-medium mt-0.5">
              <span>{totalTopics} topic{totalTopics !== 1 ? 's' : ''}</span>
              {totalDuration > 0 && <span>· {formatDuration(totalDuration)}</span>}
              {unlockedCount > 0 && (
                <span className="text-emerald-700 font-bold">· {unlockedCount}/{totalTopics} Unlocked</span>
              )}
            </div>
          </div>
        </div>

        {unit.isFree && (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-3 py-1 rounded-full shrink-0">
            Free Unit
          </span>
        )}
      </div>

      {/* Topics list with direct buy / watch button on every topic */}
      <div className="p-4 sm:p-5">
        {unit.topics.length === 0 ? (
          <p className="text-[#4A5043]/40 text-sm font-medium py-3 text-center">No topics in this unit yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {unit.topics.map((topic: any, tIdx: number) => {
              const topicExpStr = purchasedTopics[topic._id]
              const hasDirectPurchase = topic._id in purchasedTopics
              const topicExp = topicExpStr ? new Date(topicExpStr) : null
              const isTopicExpired = topicExp ? topicExp < new Date() : false

              const topicPrice = topic.price !== undefined && topic.price !== null && topic.price > 0
                ? topic.price
                : (unit.price || 0)
              const topicAccessDays = topic.accessDays || unit.accessDays || 15

              const isUnlocked =
                unit.isFree ||
                topic.isFree ||
                topicPrice === 0 ||
                isFullCoursePurchased ||
                isUnitPurchased ||
                (hasDirectPurchase && !isTopicExpired)

              return (
                <div
                  key={topic._id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isUnlocked
                      ? 'bg-emerald-50/40 border-emerald-200/50 hover:bg-emerald-50'
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  {/* Topic title & duration */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isUnlocked ? <PlayCircle size={18} /> : <Lock size={15} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#27187e] text-sm truncate">{topic.title}</span>
                        {(topic.isFree || topicPrice === 0) && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                            Free
                          </span>
                        )}
                        {isUnlocked && !topic.isFree && !unit.isFree && topicPrice > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> Unlocked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[#4A5043]/50 text-xs font-medium mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {topic.duration > 0 ? formatDuration(topic.duration) : 'Video Lesson'}
                        </span>
                        {!isUnlocked ? (
                          <span>· {topicAccessDays} Days Access</span>
                        ) : topicExp && !isTopicExpired ? (
                          <span className="text-emerald-700 font-bold">
                            · {Math.max(1, Math.ceil((topicExp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days access left
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Direct Action for this Topic */}
                  <div className="shrink-0 self-end sm:self-auto">
                    {isUnlocked ? (
                      <Link
                        href={`/watch/topic/${topic._id}`}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm"
                      >
                        <PlayCircle size={14} /> Watch
                      </Link>
                    ) : userId ? (
                      <Link
                        href={`/buy/topic/${topic._id}`}
                        className="inline-flex items-center gap-1.5 bg-[#27187e] hover:bg-[#1a0f5a] text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-100"
                      >
                        Buy {formatPKR(topicPrice)}
                      </Link>
                    ) : (
                      <Link
                        href="/sign-in"
                        className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-[#4A5043] text-xs font-bold px-4 py-2 rounded-xl transition-all border border-gray-200"
                      >
                        <Lock size={13} /> Sign in
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

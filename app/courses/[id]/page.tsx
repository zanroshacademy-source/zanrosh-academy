import { DEV_MODE, DEV_USER } from '@/lib/dev-mode'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Topic from '@/models/Topic'
import Purchase from '@/models/Purchase'
import Link from 'next/link'
import {
  BookOpen, Lock, Video,
  PlayCircle, Clock,
  AlertCircle, CheckCircle
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

interface UnitAccessInfo {
  isPurchased: boolean
  isExpired: boolean
  expiresAt: string | null
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

  // Load all topics for every unit in one query
  const allTopics = await Topic.find({
    unitId: { $in: units.map(u => u._id) },
  })
    .sort({ order: 1 })
    .select('_id title description duration order unitId isFree isPublished')
    .lean()

  const topicsByUnit = new Map<string, typeof allTopics>()
  allTopics.forEach((t: any) => {
    const key = t.unitId.toString()
    if (!topicsByUnit.has(key)) topicsByUnit.set(key, [])
    topicsByUnit.get(key)!.push(t)
  })

  let isFullCoursePurchased = false
  const unitAccessMap: Record<string, UnitAccessInfo> = {}

  if (userId) {
    const auth = await import('@/lib/auth')
    if (await auth.isSuperAdmin()) {
      isFullCoursePurchased = true
    } else {
      const [coursePurchase, unitPurchases] = await Promise.all([
        Purchase.findOne({ userId, courseId: id, status: 'approved' }).sort({ createdAt: -1 }).lean() as Promise<any>,
        Purchase.find({
          userId,
          chapterId: { $in: units.map(u => u._id) },
          status: 'approved',
        }).lean() as Promise<any[]>,
      ])

      if (coursePurchase) {
        if (!coursePurchase.expiresAt || new Date(coursePurchase.expiresAt) >= new Date()) {
          isFullCoursePurchased = true
        }
      }

      // Group purchases by chapterId to find the active or latest purchase
      const purchasesByChapter = new Map<string, any[]>()
      unitPurchases.forEach((p: any) => {
        if (p.chapterId) {
          const chKey = p.chapterId.toString()
          if (!purchasesByChapter.has(chKey)) purchasesByChapter.set(chKey, [])
          purchasesByChapter.get(chKey)!.push(p)
        }
      })

      purchasesByChapter.forEach((pList, chKey) => {
        // Check if there is an active purchase (lifetime or unexpired)
        const activePurchase = pList.find(p => !p.expiresAt || new Date(p.expiresAt) >= new Date())
        if (activePurchase) {
          unitAccessMap[chKey] = {
            isPurchased: true,
            isExpired: false,
            expiresAt: safeToIsoString(activePurchase.expiresAt),
          }
        } else {
          // All are expired: find the most recently expired one
          const sorted = pList.slice().sort(
            (a, b) => new Date(b.expiresAt || 0).getTime() - new Date(a.expiresAt || 0).getTime()
          )
          unitAccessMap[chKey] = {
            isPurchased: true,
            isExpired: true,
            expiresAt: safeToIsoString(sorted[0]?.expiresAt),
          }
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
    unitAccessMap,
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

    const { course, units, isFullCoursePurchased, unitAccessMap } = data

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

        {/* ── Units List (Only Units shown, no topics list) ─────────── */}
        <main className="max-w-4xl mx-auto px-4 py-10 pb-20">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#27187e] mb-2">Course Units</h2>
            <p className="text-[#4A5043]/70 text-sm font-medium">
              Choose any unit to unlock and watch all its video lessons.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {units.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#27187e]/10 shadow-sm">
                <AlertCircle size={40} className="mx-auto mb-4 text-[#27187e]/20" />
                <p className="text-[#4A5043]/60 font-medium">No units published yet.</p>
              </div>
            )}

            {units.map((unit: any, idx: number) => {
              const accessInfo = unitAccessMap[unit._id]
              const isUnitActive =
                isFullCoursePurchased ||
                unit.isFree ||
                (accessInfo?.isPurchased && !accessInfo?.isExpired)
              const isUnitExpired =
                !isUnitActive &&
                !unit.isFree &&
                !isFullCoursePurchased &&
                (accessInfo?.isExpired || false)
              const expiresAt = accessInfo?.expiresAt ? new Date(accessInfo.expiresAt) : null

              return (
                <UnitCard
                  key={unit._id}
                  unit={unit}
                  idx={idx}
                  isUnlocked={Boolean(isUnitActive)}
                  isExpired={Boolean(isUnitExpired)}
                  expiresAt={expiresAt}
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

// ── Clean Unit Card (Shows only Unit, Video Count, and Action Button) ─
function UnitCard({
  unit,
  idx,
  isUnlocked,
  isExpired,
  expiresAt,
  userId,
}: {
  unit: any
  idx: number
  isUnlocked: boolean
  isExpired: boolean
  expiresAt: Date | null
  userId: string | null
}) {
  const totalVideos = unit.topics?.length || 0
  const totalDuration = unit.topics?.reduce((a: number, t: any) => a + (t.duration ?? 0), 0) || 0
  const firstTopicId = unit.topics && unit.topics.length > 0 ? unit.topics[0]._id : null
  const watchUrl = firstTopicId ? `/watch/topic/${firstTopicId}` : `/watch/${unit._id}`

  let daysRemaining: number | null = null
  if (expiresAt && !isExpired) {
    const diff = expiresAt.getTime() - Date.now()
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div
      className={`bg-white border rounded-3xl p-6 sm:p-7 shadow-sm transition-all hover:shadow-md ${
        isUnlocked
          ? 'border-emerald-200/90 bg-gradient-to-br from-white to-emerald-50/20'
          : isExpired
          ? 'border-amber-200/90 bg-gradient-to-br from-white to-amber-50/20'
          : 'border-[#27187e]/10'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        
        {/* Left: Unit Details */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-sm ${
              isUnlocked
                ? 'bg-emerald-600 text-white'
                : isExpired
                ? 'bg-amber-500 text-white'
                : 'bg-[#27187e] text-white'
            }`}
          >
            {idx + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="font-black text-[#27187e] text-xl leading-tight">
                {unit.title}
              </h3>

              {/* Status Badges */}
              {unit.isFree && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-0.5 rounded-full">
                  Free Unit
                </span>
              )}
              {isUnlocked && !unit.isFree && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <CheckCircle size={12} /> Unlocked {daysRemaining !== null ? `(${daysRemaining}d left)` : ''}
                </span>
              )}
              {isExpired && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                  <Clock size={12} /> Access Expired
                </span>
              )}
            </div>

            {unit.description && (
              <p className="text-[#4A5043]/70 text-sm mb-3 line-clamp-2 leading-relaxed">
                {unit.description}
              </p>
            )}

            {/* Video count, duration, instructor, access days */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#4A5043]/70 font-semibold">
              <span className="flex items-center gap-1 text-[#27187e] font-bold">
                <Video size={13} className="text-[#3a86ff]" />
                {totalVideos} {totalVideos === 1 ? 'Video' : 'Videos'}
              </span>
              {totalDuration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {formatDuration(totalDuration)}
                </span>
              )}
              {unit.lecturedBy && (
                <span className="text-[#3a86ff] font-bold">
                  Lectures By: {unit.lecturedBy}
                </span>
              )}
              {!unit.isFree && (
                <span className="text-gray-400">
                  {unit.accessDays || 15} Days Access
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Button */}
        <div className="shrink-0 flex items-center gap-3 sm:self-center">
          {isUnlocked ? (
            <Link
              href={watchUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-100"
            >
              <PlayCircle size={18} /> Watch Unit
            </Link>
          ) : isExpired ? (
            <Link
              href={`/buy/${unit._id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-100"
            >
              <Clock size={16} /> Renew Access · {formatPKR(unit.price)} →
            </Link>
          ) : userId ? (
            <Link
              href={`/buy/${unit._id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#27187e] hover:bg-[#1a0f5a] text-white font-black text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-100"
            >
              Unlock Unit · {formatPKR(unit.price)} →
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#4A5043] font-bold text-sm px-5 py-3 rounded-xl transition-all border border-gray-200"
            >
              <Lock size={15} /> Sign in to Unlock
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}

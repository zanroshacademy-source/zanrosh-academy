import { DEV_MODE, DEV_USER } from '@/lib/dev-mode'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Topic from '@/models/Topic'
import Purchase from '@/models/Purchase'
import Link from 'next/link'
import {
  BookOpen, Lock, Unlock, ShoppingCart, Video,
  PlayCircle, Clock,
  AlertCircle, CheckCircle
} from 'lucide-react'
import { formatPKR, formatDuration } from '@/lib/utils'
import { notFound } from 'next/navigation'
import mongoose from 'mongoose'

async function getCourseData(id: string, userId: string | null) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null

  await connectDB()
  const course = await Course.findById(id).lean()
  if (!course || !course.isPublished) return null

  const units = await Chapter.find({ courseId: id, isPublished: true }).sort({ order: 1 }).lean()

  // Load all topics for every unit in one query
  const allTopics = await Topic.find({
    unitId: { $in: units.map(u => u._id) },
    isPublished: true,
  })
    .sort({ order: 1 })
    .select('_id title duration order unitId')
    .lean()

  const topicsByUnit = new Map<string, typeof allTopics>()
  allTopics.forEach((t: any) => {
    const key = t.unitId.toString()
    if (!topicsByUnit.has(key)) topicsByUnit.set(key, [])
    topicsByUnit.get(key)!.push(t)
  })

  let isFullCoursePurchased = false
  const purchasedUnitIds = new Map<string, Date | null>() // unitId → expiresAt

  if (userId) {
    const auth = await import('@/lib/auth')
    if (await auth.isSuperAdmin()) {
      isFullCoursePurchased = true
    } else {
      const coursePurchase = await Purchase.findOne({ userId, courseId: id, status: 'approved' }).lean()
      if (coursePurchase) {
        isFullCoursePurchased = true
      } else {
        // Individual unit purchases
        const unitPurchases = await Purchase.find({
          userId,
          chapterId: { $in: units.map(u => u._id) },
          status: 'approved',
        }).lean() as any[]

        unitPurchases.forEach((p: any) => {
          if (p.chapterId) {
            purchasedUnitIds.set(p.chapterId.toString(), p.expiresAt ?? null)
          }
        })
      }
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
      Array.from(purchasedUnitIds.entries()).map(([k, v]) => [k, v?.toISOString() ?? null])
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

  const data = await getCourseData(id, userId)
  if (!data) notFound()

  const { course, units, isFullCoursePurchased, purchasedUnits } = data

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

      {/* ── Units List ────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-10 pb-20">
        <h2 className="text-2xl font-black text-[#27187e] mb-2">Course Units</h2>
        <p className="text-[#4A5043]/60 text-sm font-medium mb-6">
          Buy each unit individually for {formatPKR(400)}. Access lasts 15 days from payment approval.
        </p>

        <div className="flex flex-col gap-4">
          {units.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#27187e]/10 shadow-sm">
              <AlertCircle size={40} className="mx-auto mb-4 text-[#27187e]/20" />
              <p className="text-[#4A5043]/60 font-medium">No units published yet.</p>
            </div>
          )}

          {units.map((unit: any, idx: number) => {
            const expiresAtStr = purchasedUnits[unit._id]
            const isUnitPurchased = isFullCoursePurchased || unit._id in purchasedUnits
            const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null
            const isExpired = expiresAt ? expiresAt < new Date() : false
            const daysLeft = expiresAt && !isExpired
              ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <UnitCard
                key={unit._id}
                unit={unit}
                idx={idx}
                isUnitPurchased={isUnitPurchased && !isExpired}
                isExpired={isExpired}
                daysLeft={daysLeft}
                userId={userId}
              />
            )
          })}
        </div>
      </main>
    </div>
  )
}

// ── Unit Card ───────────────────────────────────────────────────
function UnitCard({
  unit,
  idx,
  isUnitPurchased,
  isExpired,
  daysLeft,
  userId,
}: {
  unit: any
  idx: number
  isUnitPurchased: boolean
  isExpired: boolean
  daysLeft: number | null
  userId: string | null
}) {
  const totalTopics = unit.topics.length
  const totalDuration = unit.topics.reduce((a: number, t: any) => a + (t.duration ?? 0), 0)

  return (
    <div className={`bg-white border shadow-sm rounded-3xl overflow-hidden transition-all ${
      isUnitPurchased && !isExpired
        ? 'border-emerald-500/30'
        : isExpired
        ? 'border-red-500/20'
        : 'border-[#27187e]/10 hover:border-[#27187e]/20'
    }`}>
      {/* Unit header */}
      <div className="flex items-start gap-4 p-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
          isUnitPurchased && !isExpired ? 'bg-emerald-50 text-emerald-600' :
          isExpired ? 'bg-red-50 text-red-600' :
          'bg-[#f7f7ff] text-[#27187e]/50'
        }`}>
          {isUnitPurchased && !isExpired ? <Unlock size={22} /> : isExpired ? <AlertCircle size={22} /> : idx + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-black text-[#27187e] text-lg leading-tight">{unit.title}</h3>
            {isUnitPurchased && !isExpired && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={11} /> Unlocked
                {daysLeft !== null && ` · ${daysLeft}d left`}
              </span>
            )}
            {isExpired && (
              <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-bold px-2.5 py-1 rounded-full">
                Expired
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#4A5043]/60 font-medium">
            <span className="flex items-center gap-1"><Video size={11} />{totalTopics} topics</span>
            {totalDuration > 0 && <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(totalDuration)}</span>}
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          {isUnitPurchased && !isExpired ? (
            totalTopics > 0 ? (
              <Link
                href={`/watch/topic/${unit.topics[0]._id}`}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-colors"
              >
                <PlayCircle size={16} /> Watch
              </Link>
            ) : (
              <span className="text-[#4A5043]/40 text-xs font-medium">No videos yet</span>
            )
          ) : isExpired ? (
            <Link
              href={`/buy/${unit._id}?type=chapter&expired=true`}
              className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-100 transition-colors"
            >
              <ShoppingCart size={16} /> Renew
            </Link>
          ) : userId ? (
            <Link
              href={`/buy/${unit._id}?type=chapter`}
              className="flex items-center gap-2 bg-[#27187e] text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-[#1a0f5a] hover:scale-105 transition-all shadow-md"
            >
              <ShoppingCart size={16} /> {unit.isFree ? 'Free' : formatPKR(unit.price || 400)}
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center gap-2 bg-gray-100 text-[#4A5043] border border-gray-200 px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              <Lock size={16} /> Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Topics list — always visible if purchased, preview first 3 if not */}
      {unit.topics.length > 0 && (
        <div className="px-5 pb-5">
          <div className="border-t border-[#27187e]/5 pt-4">
            <div className="flex flex-col gap-1.5">
              {(isUnitPurchased && !isExpired ? unit.topics : unit.topics.slice(0, 3)).map(
                (topic: any) => (
                  <div key={topic._id} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    isUnitPurchased && !isExpired
                      ? 'hover:bg-[#f7f7ff] cursor-pointer'
                      : 'opacity-70'
                  }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isUnitPurchased && !isExpired ? 'bg-[#3a86ff]/10 text-[#3a86ff]' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isUnitPurchased && !isExpired ? <PlayCircle size={14} /> : <Lock size={12} />}
                    </div>
                    {isUnitPurchased && !isExpired ? (
                      <Link href={`/watch/topic/${topic._id}`} className="flex-1 min-w-0">
                        <span className="text-[#27187e] text-sm font-bold truncate block">{topic.title}</span>
                      </Link>
                    ) : (
                      <span className="text-[#4A5043]/60 text-sm font-medium truncate flex-1">{topic.title}</span>
                    )}
                    {topic.duration > 0 && (
                      <span className="text-[#4A5043]/40 text-xs font-bold shrink-0">{formatDuration(topic.duration)}</span>
                    )}
                  </div>
                )
              )}
              {!isUnitPurchased && !isExpired && unit.topics.length > 3 && (
                <div className="text-center py-2">
                  <span className="text-[#4A5043]/40 text-xs font-bold">
                    + {unit.topics.length - 3} more topics after purchase
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

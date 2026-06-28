import { connectDB } from '@/lib/db'
import Topic from '@/models/Topic'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Progress from '@/models/Progress'
import Purchase from '@/models/Purchase'
import Navbar from '@/components/Navbar'
import VideoPlayer from '@/components/VideoPlayer'
import Link from 'next/link'
import { ArrowLeft, Lock, BookOpen, PlayCircle, ChevronRight, Clock, CheckCircle } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import { isSuperAdmin } from '@/lib/auth'
import { formatDuration } from '@/lib/utils'

export default async function WatchTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>
}) {
  const { topicId } = await params

  if (!topicId || topicId === 'undefined') notFound()

  const { auth, currentUser } = await import('@clerk/nextjs/server')
  const session = await auth()
  const userId = session.userId
  if (!userId) redirect('/sign-in')
  const clerkUser = await currentUser()
  const userEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? 'student@zanrosh.pk'

  await connectDB()

  const topic: any = await Topic.findById(topicId).lean()
  if (!topic) notFound()

  const [unit, course, topicsInUnit]: [any, any, any[]] = await Promise.all([
    Chapter.findById(topic.unitId).lean(),
    Course.findById(topic.courseId).lean(),
    Topic.find({ unitId: topic.unitId, isPublished: true }).sort({ order: 1 })
      .select('_id title duration order').lean(),
  ])

  const superAdmin = await isSuperAdmin()
  if (!topic.isPublished && !superAdmin) notFound()

  // ── Access Check ───────────────────────────────────────────────────
  let canWatch = superAdmin || unit?.isFree
  let isExpired = false
  let expiresAt: Date | null = null

  if (!canWatch && userId && unit) {
    const purchase = await Purchase.findOne({
      userId,
      chapterId: topic.unitId,
      status: 'approved',
    }).lean() as any

    if (purchase) {
      expiresAt = purchase.expiresAt ?? null
      if (expiresAt && expiresAt < new Date()) {
        isExpired = true
      } else {
        canWatch = true
      }
    } else {
      // Check full-course purchase
      const coursePurchase = await Purchase.findOne({
        userId,
        courseId: topic.courseId,
        status: 'approved',
      }).lean()
      if (coursePurchase) canWatch = true
    }
  }

  if (isExpired) redirect(`/buy/${topic.unitId}?type=chapter&expired=true`)
  if (!canWatch) redirect(`/buy/${topic.unitId}?type=chapter`)

  // ── Video URL ──────────────────────────────────────────────────────
  let videoSrc = topic.videoUrl || ''
  let fallbackSrc = ''
  const isCloudinary =
    topic.videoProvider === 'cloudinary' ||
    (!!videoSrc && videoSrc.includes('res.cloudinary.com'))

  if (isCloudinary && videoSrc) {
    try {
      const cloudinary = (await import('cloudinary')).v2
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      })
      let publicId = topic.cloudinaryPublicId as string | undefined
      let deliveryType = videoSrc.includes('/authenticated/') ? 'authenticated' : 'upload'

      if (!publicId) {
        const parts = videoSrc.split('/')
        const typeIndex = parts.findIndex((p: string) => p === 'upload' || p === 'authenticated')
        if (typeIndex !== -1) {
          let idParts = parts.slice(typeIndex + 1)
          if (idParts[0]?.match(/^v\d+$/)) idParts = idParts.slice(1)
          publicId = idParts.join('/').replace(/\.[a-zA-Z0-9]+$/, '')
        }
      }

      if (publicId) {
        const expiry = Math.floor(Date.now() / 1000) + 3600
        videoSrc = cloudinary.url(publicId, {
          resource_type: 'video',
          type: deliveryType,
          secure: true,
          sign_url: true,
          expires_at: expiry,
          format: 'mp4',
        })
        fallbackSrc = ''
      }
    } catch (err) {
      console.error('Failed to generate signed Cloudinary URL', err)
    }
  }

  // ── Progress ───────────────────────────────────────────────────────
  const savedProgress: any = await Progress.findOne({ userId, topicId }).lean()
  const initialTime = savedProgress?.currentTime ?? 0

  // Build progress map for sidebar
  const progressMap: Record<string, number> = {}
  if (topicsInUnit.length > 0) {
    const allProgress = await Progress.find({
      userId,
      topicId: { $in: topicsInUnit.map((t: any) => t._id) },
    })
      .select('topicId percentCompleted')
      .lean() as any[]
    allProgress.forEach((p: any) => {
      progressMap[p.topicId.toString()] = p.percentCompleted
    })
  }

  // ── Days remaining ─────────────────────────────────────────────────
  let daysRemaining: number | null = null
  if (expiresAt) {
    const diff = expiresAt.getTime() - Date.now()
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1400px] w-full mx-auto">

        {/* ── Video Column ─────────────────────────────────────────── */}
        <div className="flex-1 p-4 lg:p-6 lg:pr-3">
          <Link
            href={course ? `/courses/${course._id}` : '/courses'}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white font-semibold text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> {unit?.title ?? 'Back'}
          </Link>

          {/* Title + expiry */}
          <div className="mb-3">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                {course?.title}
              </span>
              {daysRemaining !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  daysRemaining <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {daysRemaining}d left
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-white leading-tight">{topic.title}</h1>
          </div>

          {/* Player */}
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video relative mb-4">
            {!videoSrc ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 bg-gray-900">
                <Lock size={40} className="opacity-40" />
                <p className="font-medium text-sm">No video uploaded yet</p>
              </div>
            ) : (
              <VideoPlayer
                src={videoSrc}
                fallbackSrc={fallbackSrc}
                rawSrc={topic.videoUrl || ''}
                isCloudinary={isCloudinary}
                title={topic.title as string}
                userEmail={userEmail}
                topicId={topicId}
                unitId={topic.unitId.toString()}
                courseId={topic.courseId.toString()}
                initialTime={initialTime}
                savedProgress={savedProgress?.percentCompleted ?? 0}
              />
            )}
          </div>

          {topic.description && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
              <h3 className="font-bold text-white mb-2 text-sm">About this topic</h3>
              <p className="text-white/60 leading-relaxed text-sm whitespace-pre-wrap">
                {topic.description}
              </p>
            </div>
          )}

          <div className="bg-amber-500/10 text-amber-400 text-xs font-medium px-4 py-3 rounded-xl border border-amber-500/20 flex items-start gap-2">
            <Lock size={14} className="shrink-0 mt-0.5" />
            <p>This video is watermarked with your email. Sharing violates our Terms of Service and your account will be banned.</p>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <div className="w-full lg:w-[360px] p-4 lg:p-6 lg:pl-3">
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden sticky top-4">
            <div className="p-5 border-b border-white/10">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <BookOpen size={18} className="text-blue-400" />
                {unit?.title ?? 'Topics'}
              </h3>
              <p className="text-white/40 text-xs mt-1">
                {topicsInUnit.length} topic{topicsInUnit.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex flex-col p-3 gap-1 max-h-[calc(100vh-200px)] overflow-y-auto">
              {topicsInUnit.length === 0 ? (
                <div className="text-center py-8 text-white/30">
                  <PlayCircle size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No topics yet</p>
                </div>
              ) : (
                topicsInUnit.map((t: any, idx: number) => {
                  const isActive = t._id.toString() === topicId
                  const pct = progressMap[t._id.toString()] ?? 0
                  const done = pct >= 90
                  return (
                    <Link
                      key={t._id.toString()}
                      href={`/watch/topic/${t._id}`}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-blue-500/20 border border-blue-500/40'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Number / done indicator */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        done ? 'bg-emerald-500/20 text-emerald-400' :
                        isActive ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'
                      }`}>
                        {done ? <CheckCircle size={16} /> : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm leading-snug truncate ${
                          isActive ? 'text-blue-300' : 'text-white/80'
                        }`}>
                          {t.title}
                        </p>
                        {/* Progress bar */}
                        {pct > 0 && (
                          <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                done ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.duration > 0 && (
                            <span className="text-white/30 text-xs flex items-center gap-1">
                              <Clock size={10} />{formatDuration(t.duration)}
                            </span>
                          )}
                          {pct > 0 && (
                            <span className={`text-xs font-bold ${done ? 'text-emerald-400' : 'text-blue-400'}`}>
                              {pct}%
                            </span>
                          )}
                        </div>
                      </div>

                      {isActive
                        ? <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                        : <ChevronRight size={14} className="text-white/20 shrink-0" />
                      }
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

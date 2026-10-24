import { DEV_MODE, DEV_USER } from '@/lib/dev-mode'
import { connectDB } from '@/lib/db'
import Topic from '@/models/Topic'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Purchase from '@/models/Purchase'
import { redirect, notFound } from 'next/navigation'
import { formatPKR, formatDuration } from '@/lib/utils'
import EasypaisaCheckoutButton from '@/components/EasypaisaCheckoutButton'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Lock, PlayCircle, Video } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default async function BuyTopicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let userId: string | null = null
  let userEmail: string = ''

  if (DEV_MODE) {
    userId = DEV_USER.userId
    userEmail = 'dev@zanrosh.pk'
  } else {
    const { auth, currentUser } = await import('@clerk/nextjs/server')
    const session = await auth()
    userId = session.userId
    if (!userId) redirect('/sign-in')
    const clerkUser = await currentUser()
    userEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? ''
  }

  if (!userId) redirect('/sign-in')

  await connectDB()

  const topic = await Topic.findById(id).lean() as any
  if (!topic || !topic.isPublished) notFound()

  // Free topic -> redirect straight to watch
  if (topic.isFree) redirect(`/watch/topic/${id}`)

  const unit = await Chapter.findById(topic.unitId).lean() as any
  const course = await Course.findById(topic.courseId).lean() as any

  const { isSuperAdmin } = await import('@/lib/auth')
  if (await isSuperAdmin()) {
    redirect(`/watch/topic/${id}`)
  }

  // Check existing purchase for this topic or parent unit/course
  const [topicPurchase, unitPurchase, coursePurchase] = await Promise.all([
    Purchase.findOne({ userId, topicId: id }).lean() as any,
    unit ? Purchase.findOne({ userId, chapterId: topic.unitId, status: 'approved' }).lean() as any : null,
    course ? Purchase.findOne({ userId, courseId: topic.courseId, status: 'approved' }).lean() as any : null,
  ])

  const existing = topicPurchase || unitPurchase || coursePurchase

  let isExpired = false
  if (existing?.status === 'approved' && existing.expiresAt) {
    if (existing.expiresAt < new Date()) {
      isExpired = true
    }
  }

  const hasAccess = existing && existing.status === 'approved' && !isExpired
  const accessDays = topic.accessDays || unit?.accessDays || 15
  const price = (topic.price !== undefined && topic.price !== null && topic.price > 0) ? topic.price : (unit?.price || 0)

  return (
    <div className="min-h-screen bg-[#f7f7ff] pb-20">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-[#27187e]/10 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <Link
            href={course ? `/courses/${course._id}` : '/courses'}
            className="text-[#3a86ff] hover:text-[#27187e] transition-colors flex items-center gap-1 font-bold text-sm w-fit"
          >
            <ArrowLeft size={16} /> Back to Course
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#27187e]/10 text-[#27187e] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              {course?.title || 'Course'}
            </span>
            {unit?.title && (
              <span className="text-[#4A5043]/60 text-xs font-bold">
                · {unit.title}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#27187e]">
            Unlock Topic: {topic.title}
          </h1>
          <p className="text-[#4A5043]/70">
            You are purchasing access to this specific topic for {accessDays} days.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* LEFT: Payment form / Status */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#27187e]/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#27187e] to-[#3a86ff]" />

              <div className="mb-6 pb-6 border-b border-gray-100 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#3a86ff]/10 flex items-center justify-center text-[#3a86ff] shrink-0">
                  <Lock size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#27187e] mb-1">Secure Checkout</h2>
                  <p className="text-[#4A5043]/70 text-sm">Pay securely via Easypaisa</p>
                </div>
              </div>

              <div>
                {hasAccess ? (
                  <div className="text-center py-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={48} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-[#27187e] mb-3">✅ Active Access</h3>
                    <p className="text-[#4A5043] mb-8 text-lg">You already have active access to this topic.</p>
                    <Link
                      href={`/watch/topic/${id}`}
                      className="bg-[#27187e] text-white px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-md inline-flex items-center gap-2"
                    >
                      <PlayCircle size={18} /> Watch Topic Now
                    </Link>
                  </div>
                ) : (
                  <>
                    {isExpired && (
                      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-bold flex items-center gap-2">
                        <Clock size={16} /> Your previous access has expired. Please renew.
                      </div>
                    )}
                    <EasypaisaCheckoutButton
                      itemId={id}
                      itemType="topic"
                      price={price}
                      easypaisaNumber={process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || '03332121979'}
                      userEmail={userEmail}
                    />
                  </>
                )}
              </div>
            </div>

            {!hasAccess && (
              <div className="bg-[#27187e] rounded-2xl p-6 flex justify-between items-center text-white shadow-md">
                <div>
                  <span className="block text-[#f7f7ff]/70 text-sm font-bold uppercase tracking-wider mb-1">Total Due</span>
                  <span className="text-sm font-medium">{accessDays} days access</span>
                </div>
                <span className="font-black text-3xl">{formatPKR(price)}</span>
              </div>
            )}
          </div>

          {/* RIGHT: Topic Details */}
          <div className="flex flex-col">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#27187e]/10 shadow-sm h-full">
              <h3 className="text-xl font-black text-[#27187e] mb-4 flex items-center gap-2">
                <Video size={20} className="text-[#3a86ff]" /> Topic Overview
              </h3>

              <div className="bg-[#f7f7ff] p-5 rounded-2xl border border-gray-100 mb-6">
                <h4 className="font-black text-[#27187e] text-lg mb-2">{topic.title}</h4>
                {topic.description ? (
                  <p className="text-sm text-[#4A5043] whitespace-pre-wrap leading-relaxed">{topic.description}</p>
                ) : (
                  <p className="text-sm text-[#4A5043]/60 italic">Animated concept video with step-by-step physics explanation.</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                  <span className="text-sm font-bold text-[#4A5043]">Duration</span>
                  <span className="text-sm font-black text-[#27187e]">
                    {topic.duration ? formatDuration(topic.duration) : 'Full Lecture'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                  <span className="text-sm font-bold text-[#4A5043]">Access Duration</span>
                  <span className="text-sm font-black text-[#27187e]">{accessDays} Days</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                  <span className="text-sm font-bold text-[#4A5043]">Instant Unlock</span>
                  <span className="text-sm font-black text-emerald-600">Yes (via Easypaisa)</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

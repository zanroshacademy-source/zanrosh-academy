import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import { hasChapterAccess, isSuperAdmin } from '@/lib/auth'
import Purchase from '@/models/Purchase'
import Navbar from '@/components/Navbar'
import VideoPlayer from '@/components/VideoPlayer'
import Link from 'next/link'
import { ArrowLeft, Lock, BookOpen, PlayCircle, ChevronRight } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import { formatPKR } from '@/lib/utils'

export default async function WatchPage({
  params,
}: {
  params: Promise<{ chapterId: string }>
}) {
  const resolvedParams = await params
  const chapterId = resolvedParams.chapterId

  if (!chapterId || chapterId === 'undefined') {
    notFound()
  }

  let userId: string | null = null
  let userEmail = 'student@maqbool.pk'

  const { auth, currentUser } = await import('@clerk/nextjs/server')
  const session = await auth()
  userId = session.userId
  if (!userId) redirect('/sign-in')
  const clerkUser = await currentUser()
  userEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? userEmail

  await connectDB()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chapter: any = await Chapter.findById(chapterId).lean()
  if (!chapter) notFound()

  // Fetch course + chapters in parallel for faster load
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [course, courseChapters]: [any, any[]] = await Promise.all([
    Course.findById(chapter.courseId).lean(),
    Chapter.find({ courseId: chapter.courseId, isPublished: true }).sort({ order: 1 }).select('_id title price isFree order').lean(),
  ])

  // Access guard
  const superAdmin = await isSuperAdmin()

  if (!chapter.isPublished && !superAdmin) notFound()

  let canWatch = superAdmin || chapter.isFree

  if (!canWatch && userId) {
    // Check chapter-specific purchase
    canWatch = await hasChapterAccess(userId, chapterId)
    // If not, check if they bought the full course
    if (!canWatch) {
      const coursePurchase = await Purchase.findOne({ userId, courseId: chapter.courseId, status: 'approved' }).lean()
      if (coursePurchase) canWatch = true
    }
  }

  if (!canWatch) redirect(`/buy/${chapterId}?type=chapter`)

  let videoSrc: string = chapter.videoUrl || ''
  let fallbackSrc: string = ''
  // Detect Cloudinary: either by saved videoProvider field OR by URL pattern (for older records)
  const isCloudinary =
    chapter.videoProvider === 'cloudinary' ||
    (!!videoSrc && videoSrc.includes('res.cloudinary.com'))

  if (isCloudinary && videoSrc) {
    try {
      const cloudinary = (await import('cloudinary')).v2
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      })

      let publicId = chapter.cloudinaryPublicId as string | undefined
      // Detect the delivery type from the stored URL (/authenticated/ or /upload/)
      let deliveryType = 'upload'
      if (videoSrc.includes('/authenticated/')) deliveryType = 'authenticated'

      // Parse publicId from URL if not stored in DB
      if (!publicId) {
        const parts = videoSrc.split('/')
        const typeIndex = parts.findIndex((p: string) => p === 'upload' || p === 'authenticated')
        if (typeIndex !== -1) {
          let idParts = parts.slice(typeIndex + 1)
          // Remove version segment like v1234567890
          if (idParts[0] && idParts[0].match(/^v\d+$/)) {
            idParts = idParts.slice(1)
          }
          publicId = idParts.join('/').replace(/\.[a-zA-Z0-9]+$/, '')
        }
      }

      if (publicId) {
        const expiry = Math.floor(Date.now() / 1000) + 3600 // 1-hour signed URL

        videoSrc = cloudinary.url(publicId, {
          resource_type: 'video',
          type: deliveryType,
          secure: true,
          sign_url: true,
          expires_at: expiry,
          format: 'mp4',
        })

        // No separate fallbackSrc needed — rawSrc is the last-resort in VideoPlayer
        fallbackSrc = ''
      }
    } catch (err) {
      console.error('Failed to generate signed Cloudinary URL', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7ff] flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1400px] w-full mx-auto">

        {/* Video Area */}
        <div className="flex-1 p-4 lg:p-8 lg:pr-4">
          <Link
            href={course ? `/courses/${course._id}` : '/courses'}
            className="inline-flex items-center gap-2 text-[#4A5043] hover:text-[#27187e] font-semibold text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> {course ? course.title : 'Back to Courses'}
          </Link>

          <div className="mb-4">
            <h1 className="text-2xl font-black text-[#27187e] mb-2">{chapter.title}</h1>
            <div className="flex flex-wrap gap-3 items-center mt-3">
              {chapter.isFree && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Free</span>}
              {superAdmin && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">Admin View</span>}
            </div>
          </div>

          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video relative mb-6">
            <div className="absolute top-4 right-4 z-50 pointer-events-none opacity-30 bg-black/50 px-3 py-1 rounded text-white font-mono text-xs">
              {userEmail}
            </div>
            {!videoSrc ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 bg-gray-900">
                <Lock size={48} className="opacity-50" />
                <p className="font-medium">No video uploaded yet</p>
              </div>
            ) : (
              <VideoPlayer
                src={videoSrc}
                fallbackSrc={fallbackSrc}
                rawSrc={chapter.videoUrl || ''}
                isCloudinary={isCloudinary}
                title={chapter.title as string}
                userEmail={userEmail}
              />
            )}
          </div>

          {chapter.description && (
            <div className="bg-white rounded-2xl p-6 border border-[#27187e]/10 shadow-sm">
              <h3 className="font-bold text-[#27187e] mb-3 text-lg border-b border-gray-100 pb-3">About this chapter</h3>
              <p className="text-[#4A5043] leading-relaxed whitespace-pre-wrap">
                {chapter.description}
              </p>
            </div>
          )}

          <div className="bg-amber-50 text-amber-800 text-sm font-medium px-4 py-3 rounded-xl border border-amber-200 mt-6 flex items-start gap-2">
            <Lock size={16} className="shrink-0 mt-0.5" />
            <p>This video is watermarked with your account email. Sharing violates our Terms of Service.</p>
          </div>
        </div>

        {/* Sidebar — Other chapters in this course */}
        <div className="w-full lg:w-[380px] p-4 lg:p-8 lg:pl-4">
          <div className="bg-white rounded-3xl p-5 border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)] flex flex-col">
            <h3 className="text-xl font-black text-[#27187e] mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
              <BookOpen size={20} /> {course ? course.title : 'Course Chapters'}
            </h3>
            <div className="flex flex-col gap-2">
              {courseChapters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PlayCircle size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No other chapters.</p>
                </div>
              ) : (
                courseChapters.map((ch, idx) => {
                  const isActive = ch._id.toString() === chapterId
                  return (
                    <Link
                      key={ch._id.toString()}
                      href={`/watch/${ch._id}`}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${
                        isActive
                          ? 'border-[#27187e] bg-[#27187e]/5'
                          : 'border-transparent hover:bg-gray-50 hover:border-gray-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                        isActive ? 'bg-[#27187e] text-white' : 'bg-[#27187e]/10 text-[#27187e]'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className={`font-bold text-sm leading-tight mb-1 ${
                          isActive ? 'text-[#27187e]' : 'text-[#4A5043]'
                        }`}>
                          {ch.title}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">
                          {ch.isFree ? 'Free' : formatPKR(ch.price)}
                        </p>
                      </div>
                      {isActive 
                        ? <div className="w-2 h-2 rounded-full bg-[#27187e] animate-pulse mt-2 shrink-0" />
                        : <ChevronRight size={14} className="text-gray-300 shrink-0" />
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

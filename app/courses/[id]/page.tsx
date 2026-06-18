import { DEV_MODE, DEV_USER } from '@/lib/dev-mode'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Purchase from '@/models/Purchase'
import Link from 'next/link'
import { BookOpen, Lock, Unlock, Clock, ShoppingCart, Video, PlayCircle, Layers } from 'lucide-react'
import { formatPKR, formatDuration } from '@/lib/utils'
import { notFound } from 'next/navigation'

async function getCourseData(id: string, userId: string | null) {
  if (DEV_MODE) {
    // Mock logic handled elsewhere, for now just use DB
  }

  await connectDB()
  const course = await Course.findById(id).lean()
  if (!course || !course.isPublished) return null

  // Get all chapters for this course
  const chapters = await Chapter.find({ courseId: id }).sort({ order: 1 }).lean()
  
  let isFullCoursePurchased = false
  const purchasedChapterIds = new Set<string>()

  if (userId) {
    const { isSuperAdmin } = await import('@/lib/auth')
    if (await isSuperAdmin()) {
      isFullCoursePurchased = true
    } else {
      // Check full course purchase
      const coursePurchase = await Purchase.findOne({ userId, courseId: id, status: 'approved' }).lean()
      if (coursePurchase) {
        isFullCoursePurchased = true
      } else {
        // Check individual chapter purchases
        const chapterPurchases = await Purchase.find({ userId, status: 'approved' }).lean()
        chapterPurchases.forEach(p => {
          if (p.chapterId) purchasedChapterIds.add(p.chapterId.toString())
        })
      }
    }
  }

  return {
    course: { ...course, _id: course._id.toString() },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chapters: chapters.map((c: any) => ({ ...c, _id: c._id.toString(), courseId: c.courseId.toString() })),
    isFullCoursePurchased,
    purchasedChapterIds: Array.from(purchasedChapterIds)
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

  const { course, chapters, isFullCoursePurchased, purchasedChapterIds } = data

  return (
    <div className="min-h-screen bg-[#f7f7ff]">
      
      {/* Course Header Hero */}
      <div className="bg-[#27187e] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
                <BookOpen size={16} /> {(course as any).category || 'General'}
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
                <Layers size={16} /> Class: {(course as any).level || 'General'}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{course.title}</h1>
            <p className="text-xl text-[#f7f7ff]/80 leading-relaxed mb-8 max-w-2xl">
              {course.description}
            </p>
          </div>
          
          {(course as any).thumbnail && (
            <div className="w-full md:w-80 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={(course as any).thumbnail} alt={course.title} className="w-full aspect-video object-cover" />
            </div>
          )}

        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)] overflow-hidden flex flex-col md:flex-row relative group">
          {/* Left Side: Info */}
          <div className="flex-1 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isFullCoursePurchased ? 'bg-green-100 text-green-600' : course.isFree ? 'bg-blue-100 text-blue-600' : 'bg-[#27187e]/10 text-[#27187e]'}`}>
                {isFullCoursePurchased ? <Unlock size={20} /> : course.isFree ? <Unlock size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#27187e] leading-tight">Course Contents</h3>
                <p className="text-[#4A5043] text-sm">Unlock the full course to access all {chapters.length} chapters, or buy them individually.</p>
              </div>
            </div>

            {/* Chapters List */}
            <div className="bg-[#f7f7ff] rounded-2xl p-4 border border-[#27187e]/5">
              <h4 className="font-bold text-[#27187e] mb-3 flex items-center gap-2 text-sm">
                <Video size={16} /> Included Chapters
              </h4>
              <ul className="flex flex-col gap-3">
                {chapters.length === 0 ? (
                  <li className="text-gray-400 text-sm">No chapters added yet.</li>
                ) : (
                  chapters.map((ch: any, idx: number) => {
                    const isChapterUnlocked = isFullCoursePurchased || ch.isFree || purchasedChapterIds.includes(ch._id)
                    return (
                      <li key={ch._id} className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-[#4A5043] bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-[#27187e]/40 font-bold shrink-0 text-lg w-6">{idx + 1}.</span>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#27187e] truncate">{ch.title}</span>
                            {ch.duration > 0 && (
                              <span className="flex items-center gap-1 text-gray-400 shrink-0 text-xs mt-0.5"><Clock size={12} /> {formatDuration(ch.duration)}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:pl-4 sm:border-l border-gray-100 shrink-0 self-end sm:self-auto">
                          {isChapterUnlocked ? (
                            <Link href={`/watch/${ch._id}`} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5">
                              <PlayCircle size={14} /> Watch
                            </Link>
                          ) : (
                            <Link href={`/buy/${ch._id}?type=chapter`} className="bg-[#27187e]/10 text-[#27187e] hover:bg-[#27187e]/20 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5">
                              <ShoppingCart size={14} /> {formatPKR(ch.price)}
                            </Link>
                          )}
                        </div>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </div>

          {/* Right Side: Action Box */}
          <div className="bg-[#f7f7ff]/50 border-t md:border-t-0 md:border-l border-[#27187e]/10 p-6 md:p-8 flex flex-col justify-center items-center text-center w-full md:w-72 shrink-0">
            <span className={`text-4xl font-black mb-1 ${course.isFree ? 'text-green-600' : 'text-[#27187e]'}`}>
              {course.isFree ? 'FREE' : formatPKR(course.price)}
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Full Course Access</span>

            {isFullCoursePurchased ? (
              <div className="w-full bg-green-500 text-white px-6 py-4 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 text-lg cursor-default">
                <Unlock size={20} /> Fully Unlocked
              </div>
            ) : course.isFree ? (
              <div className="w-full bg-green-500 text-white px-6 py-4 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 text-lg cursor-default">
                <Unlock size={20} /> Free Access
              </div>
            ) : userId ? (
              <Link href={`/buy/${course._id}?type=course`} className="w-full bg-[#27187e] text-white px-6 py-4 rounded-xl font-bold hover:bg-[#1a0f5a] hover:scale-105 transition-all shadow-md flex justify-center items-center gap-2 text-lg">
                <ShoppingCart size={20} /> Buy Full Course
              </Link>
            ) : (
              <Link href="/sign-in" className="w-full bg-[#27187e] text-white px-6 py-4 rounded-xl font-bold hover:bg-[#1a0f5a] hover:scale-105 transition-all shadow-md flex justify-center items-center gap-2 text-lg">
                Sign In to Buy
              </Link>
            )}
            {isFullCoursePurchased && <div className="text-green-600 text-sm font-bold mt-4 uppercase tracking-wider">✓ All Chapters Unlocked</div>}
          </div>
        </div>
      </main>
    </div>
  )
}

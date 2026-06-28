import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Topic from '@/models/Topic'
import { getServerAuth } from '@/lib/server-auth'
import { isSuperAdmin } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, LayoutList } from 'lucide-react'
import { formatPKR } from '@/lib/utils'
import AdminCourseActions from '@/components/AdminCourseActions'
import AdminAddChapterForm from '@/components/AdminAddChapterForm'
import AdminUnitsPanel from '@/components/AdminUnitsPanel'

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await getServerAuth()
  if (!userId) redirect('/sign-in')

  await connectDB()
  const course = await Course.findById(id).lean()
  if (!course) notFound()

  const superAdmin = await isSuperAdmin()
  if (!superAdmin && course.adminId !== userId) redirect('/dashboard')

  const units = await Chapter.find({ courseId: id }).sort({ order: 1 }).lean()

  // Load topics for each unit in parallel
  const topicsMap: Record<string, any[]> = {}
  if (units.length > 0) {
    const allTopics = await Topic.find({
      unitId: { $in: units.map(u => u._id) },
    })
      .sort({ order: 1 })
      .lean()
    allTopics.forEach((t: any) => {
      const key = t.unitId.toString()
      if (!topicsMap[key]) topicsMap[key] = []
      topicsMap[key].push({ ...t, _id: t._id.toString(), unitId: key, courseId: t.courseId.toString() })
    })
  }

  const courseData = { ...course, _id: course._id.toString() }
  const unitsData = units.map((u: any) => ({
    ...u,
    _id: u._id.toString(),
    courseId: u.courseId.toString(),
    topics: topicsMap[u._id.toString()] ?? [],
  }))

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-[#4A5043] hover:text-[#27187e] font-semibold text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      {/* ── Course Header ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#27187e] to-[#1a0f5a] rounded-3xl p-8 mb-6 shadow-[0_20px_60px_rgba(39,24,126,0.3)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/3 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
          <div className="flex gap-5 items-start flex-1">
            {(courseData as any).thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(courseData as any).thumbnail} alt={courseData.title}
                className="w-24 h-16 rounded-2xl object-cover shrink-0 border-2 border-white/20 shadow-xl" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-black text-white">{courseData.title}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  courseData.isPublished ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
                }`}>
                  {courseData.isPublished ? '🌐 Published' : '📝 Draft'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm mb-3">
                {(courseData as any).category && (
                  <span className="bg-white/10 text-white/80 px-3 py-1 rounded-lg font-bold text-xs">
                    {(courseData as any).category}
                  </span>
                )}
                {(courseData as any).level && (
                  <span className="bg-white/10 text-white/80 px-3 py-1 rounded-lg font-bold text-xs">
                    Class: {(courseData as any).level}
                  </span>
                )}
                <span className="bg-white/10 text-white/80 px-3 py-1 rounded-lg font-bold text-xs">
                  {unitsData.length} Unit{unitsData.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-xl">{courseData.description}</p>
            </div>
          </div>
          <div className="shrink-0">
            <AdminCourseActions courseId={id} isPublished={courseData.isPublished} />
          </div>
        </div>
      </div>

      {/* ── Units + Topics Panel ──────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#27187e]/10 flex items-center justify-center">
            <LayoutList size={20} className="text-[#27187e]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#27187e]">Units & Topics</h2>
            <p className="text-[#4A5043]/60 text-xs">Each unit is sold individually. Add topics inside each unit.</p>
          </div>
        </div>
        <AdminUnitsPanel units={unitsData} courseId={id} />
      </div>

      {/* ── Add New Unit ──────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-8 border border-[#27187e]/10 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#27187e]/10 flex items-center justify-center">
            <BookOpen size={20} className="text-[#27187e]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#27187e]">Add New Unit</h2>
            <p className="text-[#4A5043]/60 text-xs">Units are sold for PKR 400 by default (configurable). Active for 15 days.</p>
          </div>
        </div>
        <AdminAddChapterForm courseId={id} nextOrder={unitsData.length} />
      </div>
    </div>
  )
}

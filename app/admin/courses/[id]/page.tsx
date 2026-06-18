import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import { getServerAuth } from '@/lib/server-auth'
import { isSuperAdmin } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatPKR } from '@/lib/utils'
import AdminCourseActions from '@/components/AdminCourseActions'
import AdminAddChapterForm from '@/components/AdminAddChapterForm'
import AdminCourseChapters from '@/components/AdminCourseChapters'

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

  const chapters = await Chapter.find({ courseId: id }).sort({ order: 1 }).lean()

  const courseData = { ...course, _id: course._id.toString() }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chaptersData = chapters.map((c: any) => ({
    ...c,
    _id: c._id.toString(),
    courseId: c.courseId.toString(),
  }))

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-[#4A5043] hover:text-[#27187e] font-semibold text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      {/* Course Header */}
      <div className="bg-white rounded-3xl p-8 mb-8 border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#27187e]/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
          <div className="flex gap-5 items-start flex-1">
            {(courseData as any).thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(courseData as any).thumbnail}
                alt={courseData.title}
                className="w-28 h-20 rounded-2xl object-cover shrink-0 border border-gray-100 shadow-sm"
              />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-black text-[#27187e]">{courseData.title}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  courseData.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {courseData.isPublished ? '🌐 Published' : '📝 Draft'}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-[#4A5043] mb-3">
                {(courseData as any).category && <span className="bg-[#27187e]/10 text-[#27187e] px-2 py-0.5 rounded-lg font-bold">{(courseData as any).category}</span>}
                {(courseData as any).level && <span className="bg-[#27187e]/10 text-[#27187e] px-2 py-0.5 rounded-lg font-bold">Class: {(courseData as any).level}</span>}
                <span className="font-black text-[#27187e]">{courseData.isFree ? 'FREE' : formatPKR(courseData.price)}</span>
              </div>
              <p className="text-[#4A5043] leading-relaxed">{courseData.description}</p>
              <div className="mt-3 text-sm font-semibold text-[#4A5043]/70">
                {chaptersData.length} chapter{chaptersData.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <AdminCourseActions courseId={id} isPublished={courseData.isPublished} />
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="bg-white rounded-3xl p-8 mb-6 border border-[#27187e]/10 shadow-sm">
        <h2 className="text-2xl font-black text-[#27187e] mb-6">Chapters ({chaptersData.length})</h2>
        <AdminCourseChapters chapters={chaptersData} courseId={id} />
      </div>

      {/* Add Chapter Form */}
      <div className="bg-white rounded-3xl p-8 border border-[#27187e]/10 shadow-sm">
        <h2 className="text-2xl font-black text-[#27187e] mb-6">Add New Chapter</h2>
        <AdminAddChapterForm
          courseId={id}
          nextOrder={chaptersData.length}
        />
      </div>
    </div>
  )
}

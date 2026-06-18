import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import { getServerAuth } from '@/lib/server-auth'
import { isSuperAdmin } from '@/lib/auth'
import Link from 'next/link'
import { Plus, BookOpen, Edit, Globe, EyeOff, Video } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

async function getCourses(userId: string, superAdmin: boolean) {
  await connectDB()
  const query = superAdmin ? {} : { adminId: userId }
  const courses = await Course.find(query).sort({ createdAt: -1 }).lean()
  const chapterCountMap = new Map<string, number>()
  if (courses.length > 0) {
    const counts = await Chapter.aggregate([
      { $match: { courseId: { $in: courses.map(c => c._id) } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ])
    counts.forEach(c => chapterCountMap.set(c._id.toString(), c.count))
  }
  return courses.map(c => ({
    ...c,
    _id: c._id.toString(),
    chapterCount: chapterCountMap.get(c._id.toString()) ?? 0,
  }))
}

export default async function AdminCoursesPage() {
  const { userId } = await getServerAuth()
  const superAdmin = await isSuperAdmin()
  const courses = await getCourses(userId ?? 'dev_admin', superAdmin)

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#27187e]">{superAdmin ? 'All Courses' : 'My Courses'}</h1>
          <p className="text-[#4A5043] mt-1">
            {superAdmin ? 'Manage all courses on the platform' : 'Create and manage your courses'}
          </p>
        </div>
        <Link href="/admin/courses/new"
          className="bg-[#27187e] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 hover:shadow-lg transition-all">
          <Plus size={18} /> New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-[#27187e]/10 shadow-sm">
          <div className="w-20 h-20 bg-[#27187e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={40} className="text-[#27187e]/60" />
          </div>
          <h3 className="text-xl font-black text-[#27187e] mb-2">No courses yet</h3>
          <p className="text-[#4A5043]/70 mb-6">Create your first course and start adding chapters</p>
          <Link href="/admin/courses/new"
            className="bg-[#27187e] text-white px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform">
            <Plus size={16} /> Create First Course
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {courses.map((course: any) => (
            <div key={course._id} className="bg-white rounded-2xl border border-[#27187e]/10 shadow-sm hover:shadow-md transition-shadow flex flex-wrap items-center gap-4 p-5">
              {course.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail} alt={course.title} className="w-20 h-14 rounded-xl object-cover shrink-0 bg-gray-100" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-black text-[#27187e] text-lg leading-tight">{course.title}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    course.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {course.isPublished ? <><Globe size={10} className="inline mr-1" />Published</> : <><EyeOff size={10} className="inline mr-1" />Draft</>}
                  </span>
                  {course.isFree && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">FREE</span>}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#4A5043]">
                  {course.category && <span className="font-medium">{course.category}</span>}
                  {course.level && <span className="font-medium">Class: {course.level}</span>}
                  <span className="flex items-center gap-1">
                    <Video size={13} className="opacity-60" />
                    {course.chapterCount} chapter{course.chapterCount !== 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-[#27187e]">{course.isFree ? 'FREE' : formatPKR(course.price)}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/courses/${course._id}`}
                  className="bg-gray-100 text-[#4A5043] px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">
                  Preview
                </Link>
                <Link href={`/admin/courses/${course._id}`}
                  className="bg-[#27187e] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 hover:bg-[#1a0f5a] transition-colors">
                  <Edit size={14} /> Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

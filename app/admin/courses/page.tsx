import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Topic from '@/models/Topic'
import { getServerAuth } from '@/lib/server-auth'
import { isSuperAdmin } from '@/lib/auth'
import Link from 'next/link'
import { Plus, BookOpen, Edit, Globe, EyeOff, Video, Layers } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

async function getCourses(userId: string, superAdmin: boolean) {
  await connectDB()
  const query = superAdmin ? {} : { adminId: userId }
  const courses = await Course.find(query).sort({ createdAt: -1 }).lean()

  if (courses.length === 0) return []

  const courseIds = courses.map(c => c._id)
  const [unitCounts, topicCounts] = await Promise.all([
    Chapter.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]),
    Topic.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]),
  ])

  const unitMap  = new Map(unitCounts.map((u: any) => [u._id.toString(), u.count]))
  const topicMap = new Map(topicCounts.map((t: any) => [t._id.toString(), t.count]))

  return courses.map(c => ({
    ...c,
    _id: c._id.toString(),
    unitCount:  unitMap.get(c._id.toString())  ?? 0,
    topicCount: topicMap.get(c._id.toString()) ?? 0,
  }))
}

export default async function AdminCoursesPage() {
  const { userId } = await getServerAuth()
  const superAdmin = await isSuperAdmin()
  const courses = await getCourses(userId ?? 'dev_admin', superAdmin)

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#27187e]">
            {superAdmin ? 'All Courses' : 'My Courses'}
          </h1>
          <p className="text-[#4A5043]/60 mt-1 text-sm">
            {superAdmin ? 'Manage all courses on the platform' : 'Create and manage your courses'}
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="bg-[#27187e] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 hover:shadow-xl hover:shadow-[#27187e]/20 transition-all text-sm"
        >
          <Plus size={18} /> New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-[#27187e]/10 shadow-sm">
          <div className="w-20 h-20 bg-[#27187e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={40} className="text-[#27187e]/40" />
          </div>
          <h3 className="text-xl font-black text-[#27187e] mb-2">No courses yet</h3>
          <p className="text-[#4A5043]/60 mb-6 text-sm">Create your first course and start adding units</p>
          <Link
            href="/admin/courses/new"
            className="bg-[#27187e] text-white px-8 py-3 rounded-2xl font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform text-sm"
          >
            <Plus size={16} /> Create First Course
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((course: any) => (
            <div
              key={course._id}
              className="group bg-white rounded-2xl border border-[#27187e]/10 shadow-sm hover:shadow-md hover:border-[#27187e]/20 transition-all flex flex-wrap items-center gap-4 p-5"
            >
              {/* Thumbnail */}
              <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-[#27187e] to-[#1a0f5a] flex items-center justify-center">
                {course.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={20} className="text-white/30" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="font-black text-[#27187e] text-base leading-tight">{course.title}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    course.isPublished
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {course.isPublished
                      ? <><Globe size={10} className="inline mr-1" />Published</>
                      : <><EyeOff size={10} className="inline mr-1" />Draft</>}
                  </span>
                  {course.isFree && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">FREE</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#4A5043]/60 font-medium">
                  {course.category && (
                    <span className="flex items-center gap-1">
                      <BookOpen size={11} /> {course.category}
                    </span>
                  )}
                  {course.level && (
                    <span className="flex items-center gap-1">
                      <Layers size={11} /> {course.level}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#27187e]/10 flex items-center justify-center">
                      <BookOpen size={10} className="text-[#27187e]" />
                    </div>
                    <span className="font-bold text-[#27187e]">{course.unitCount}</span> unit{course.unitCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center">
                      <Video size={10} className="text-blue-600" />
                    </div>
                    <span className="font-bold text-blue-600">{course.topicCount}</span> topic{course.topicCount !== 1 ? 's' : ''}
                  </span>
                  <span className="font-black text-[#27187e]">
                    {course.isFree ? 'FREE' : formatPKR(course.price)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/courses/${course._id}`}
                  className="bg-gray-100 text-[#4A5043] px-4 py-2 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  Preview
                </Link>
                <Link
                  href={`/admin/courses/${course._id}`}
                  className="bg-[#27187e] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-[#1a0f5a] transition-colors"
                >
                  <Edit size={13} /> Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

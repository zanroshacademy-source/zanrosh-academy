import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Topic from '@/models/Topic'
import CourseFilters from '@/components/CourseFilters'

async function getCourses() {
  await connectDB()
  // Fetch ALL published courses
  const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).lean()
  const courseIds = courses.map(c => c._id)

  const [unitCounts, topicCounts] = await Promise.all([
    Chapter.aggregate([
      { $match: { courseId: { $in: courseIds }, isPublished: true } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]),
    Topic.aggregate([
      { $match: { courseId: { $in: courseIds }, isPublished: true } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]),
  ])

  const unitCountMap  = new Map(unitCounts.map((u: any) => [u._id.toString(), u.count]))
  const topicCountMap = new Map(topicCounts.map((t: any) => [t._id.toString(), t.count]))

  return courses.map(course => ({
    ...course,
    _id: course._id.toString(),
    unitCount:  unitCountMap.get(course._id.toString())  ?? 0,
    topicCount: topicCountMap.get(course._id.toString()) ?? 0,
    classLevel: (course as any).level || 'General',
    price: course.price || 0,
  }))
}

export default async function CoursesPage() {
  const courses = await getCourses()

  return (
    <main className="min-h-screen bg-[#f7f7ff]">
      {/* Hero */}
      <div className="relative overflow-hidden pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#27187e]/5 border border-[#27187e]/10 rounded-full px-4 py-2 text-[#27187e] text-xs font-bold mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            9th · 10th · 11th · 12th Classes
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[#27187e] mb-6 leading-none tracking-tight">
            Learn by{' '}
            <span className="text-[#3a86ff]">
              Unit
            </span>
          </h1>
          <p className="text-[#4A5043]/70 text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Choose only the units you want.{' '}
            <span className="text-[#27187e] font-bold">Own your learning</span>{' '}
            — study at your own pace with full access to every video in your unit.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="max-w-4xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Courses', value: courses.length },
            { label: 'Units available', value: courses.reduce((a, c) => a + (c.unitCount ?? 0), 0) },
            { label: 'Video topics', value: courses.reduce((a, c) => a + (c.topicCount ?? 0), 0) },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#27187e]/10 shadow-sm rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-[#27187e] mb-1">{s.value}</div>
              <div className="text-[#4A5043]/50 text-xs font-bold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + Course Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <CourseFilters courses={courses} />
      </div>
    </main>
  )
}

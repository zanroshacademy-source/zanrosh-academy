import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Topic from '@/models/Topic'
import CourseFilters from '@/components/CourseFilters'

async function getCourses() {
  await connectDB()
  const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).lean()
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
    <main className="min-h-screen bg-gradient-to-b from-[#0d0f1f] via-[#12153a] to-[#0d0f1f]">
      {/* Hero */}
      <div className="relative overflow-hidden pt-20 pb-16 px-6">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#27187e]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[200px] h-[200px] bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[200px] h-[200px] bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white/60 text-xs font-bold mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            9th · 10th · 11th · 12th Classes
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-none tracking-tight">
            Learn by{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Unit
            </span>
          </h1>
          <p className="text-white/50 text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Buy only what you need. Each unit unlocks all its video topics for{' '}
            <span className="text-white font-bold">15 days</span> — no long commitments.
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
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-white/40 text-xs font-bold uppercase tracking-wider">{s.label}</div>
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

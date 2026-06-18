import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import Link from 'next/link'
import { BookOpen, Star, Video, Layers } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

import CourseFilters from '@/components/CourseFilters'

async function getCourses() {
  await connectDB()
  const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).lean()
  const courseIds = courses.map(c => c._id)

  const chapterCounts = await Chapter.aggregate([
    { $match: { courseId: { $in: courseIds } } },
    { $group: { _id: '$courseId', count: { $sum: 1 } } }
  ])
  const chapterCountMap = new Map(chapterCounts.map(l => [l._id.toString(), l.count]))

  return courses.map((course) => {
    return { 
      ...course, 
      _id: course._id.toString(), 
      totalLectures: chapterCountMap.get(course._id.toString()) || 0, // Using totalLectures prop name for compatibility with CourseFilters
      classLevel: (course as any).level || 'General',
      price: course.price || 0,
      rating: 4.5, // Mock rating for now
      reviewsCount: 120 // Mock reviews
    }
  })
}

export default async function CoursesPage() {
  const courses = await getCourses()

  return (
    <main className="min-h-screen bg-[#f7f7ff] py-16 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-[#27187e] mb-4">Explore Our Courses</h1>
        <p className="text-[#4A5043] text-lg font-medium max-w-2xl mx-auto">
          Tailored curriculums for 9th, 10th, 11th, and 12th Classes. Buy exactly the courses you need.
        </p>
      </div>

      <CourseFilters courses={courses} />
    </main>
  )
}

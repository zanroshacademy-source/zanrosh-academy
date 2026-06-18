'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Star, Video, Layers, ArrowRight } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CourseFilters({ courses }: { courses: any[] }) {
  const [activeClass, setActiveClass] = useState<string>('All')
  
  const classes = ['All', '9th Class', '10th Class', '11th Class', '12th Class']
  
  const filteredCourses = activeClass === 'All' 
    ? courses 
    : courses.filter(c => c.classLevel === activeClass)

  return (
    <div>
      {/* Class Filter Cards */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {classes.map(cls => (
          <button
            key={cls}
            onClick={() => setActiveClass(cls)}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm ${
              activeClass === cls 
                ? 'bg-[#27187e] text-white scale-105 shadow-[0_8px_20px_rgba(39,24,126,0.25)]' 
                : 'bg-white text-[#4A5043] border border-gray-100 hover:bg-[#27187e]/5 hover:text-[#27187e]'
            }`}
          >
            {cls}
          </button>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="max-w-3xl mx-auto text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-[#27187e]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={40} className="text-[#27187e]/40" />
          </div>
          <h3 className="text-2xl font-bold text-[#27187e] mb-2">No courses found</h3>
          <p className="text-[#4A5043]">There are currently no courses available for {activeClass}.</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <Link key={course._id} href={`/courses/${course._id}`} className="group block">
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(39,24,126,0.1)] transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1">
                
                {/* Thumbnail */}
                <div className="relative h-56 w-full bg-[#27187e] overflow-hidden">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-white/90 backdrop-blur text-[#27187e] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                      <Layers size={14} /> {course.classLevel}
                    </span>
                  </div>
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#27187e] to-[#4A5043]">
                      <BookOpen size={64} className="text-white/20" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-[#27187e]">{(course.rating || 0).toFixed(1)}</span>
                    <span className="text-xs text-gray-400 font-medium">({course.reviewsCount || 0} reviews)</span>
                  </div>

                  {/* Title & Desc */}
                  <h2 className="text-xl font-bold text-[#27187e] mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h2>
                  <p className="text-[#4A5043] text-sm mb-6 flex-1 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#27187e]/5 flex items-center justify-center text-[#27187e]">
                        <BookOpen size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium">Category</span>
                        <span className="text-sm font-bold text-[#27187e]">{course.category || 'General'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#4A5043]/5 flex items-center justify-center text-[#4A5043]">
                        <Video size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium">Chapters</span>
                        <span className="text-sm font-bold text-[#27187e]">{course.totalLectures}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 font-medium mb-0.5">Full Course</span>
                      <span className="text-lg font-black text-[#27187e]">{formatPKR(course.price)}</span>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-[#27187e] text-white flex items-center justify-center group-hover:w-32 group-hover:justify-between group-hover:px-4 transition-all duration-300 overflow-hidden shadow-md">
                      <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto font-bold text-sm whitespace-nowrap transition-all duration-300 delay-75">
                        Enroll Now
                      </span>
                      <ArrowRight size={18} className="flex-shrink-0" />
                    </div>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

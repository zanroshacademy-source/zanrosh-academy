'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Video, Layers, ArrowRight, Clock } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

export default function CourseFilters({ courses }: { courses: any[] }) {
  const [activeClass, setActiveClass] = useState<string>('All')

  // Derive unique classes from the data instead of hardcoding dummy data
  const availableClasses = Array.from(new Set(courses.map(c => c.classLevel))).filter(Boolean)
  const classes = ['All', ...availableClasses.sort()]

  const filteredCourses =
    activeClass === 'All' ? courses : courses.filter(c => c.classLevel === activeClass)

  return (
    <div>
      {/* Class Filter Tabs */}
      {classes.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {classes.map(cls => (
            <button
              key={cls}
              onClick={() => setActiveClass(cls)}
              className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 ${
                activeClass === cls
                  ? 'bg-[#27187e] text-white shadow-md scale-105'
                  : 'bg-white text-[#4A5043]/70 border border-[#27187e]/10 hover:bg-gray-50 hover:text-[#27187e]'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      )}

      {filteredCourses.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-20 bg-white border border-[#27187e]/10 rounded-3xl">
          <div className="w-20 h-20 bg-[#27187e]/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#27187e]/10">
            <BookOpen size={36} className="text-[#27187e]/30" />
          </div>
          <h3 className="text-xl font-black text-[#27187e] mb-2">No courses found</h3>
          <p className="text-[#4A5043]/60 font-medium">No courses available for {activeClass} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Link key={course._id} href={`/courses/${course._id}`} className="group block">
              <div className="bg-white border border-[#27187e]/10 shadow-sm rounded-3xl overflow-hidden hover:border-[#27187e]/30 hover:shadow-lg transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1">

                {/* Thumbnail */}
                <div className="relative h-48 w-full bg-gradient-to-br from-[#27187e]/5 to-[#27187e]/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                  <div className="absolute top-3 left-3 z-20">
                    <span className="bg-white/90 backdrop-blur border border-white/20 text-[#27187e] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Layers size={12} /> {course.classLevel}
                    </span>
                  </div>
                  {course.unitCount > 0 && (
                    <div className="absolute bottom-3 right-3 z-20">
                      <span className="bg-[#3a86ff] text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md">
                        from {formatPKR(400)}
                      </span>
                    </div>
                  )}
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={56} className="text-[#27187e]/20" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Subject badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#27187e]/50 text-xs font-bold uppercase tracking-wider">
                      {course.category || 'General'}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-black text-[#27187e] mb-2 leading-snug group-hover:text-[#3a86ff] transition-colors">
                    {course.title}
                  </h2>
                  <p className="text-[#4A5043]/70 text-sm mb-5 flex-1 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-[#27187e]/10 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#3a86ff]/10 flex items-center justify-center">
                        <BookOpen size={14} className="text-[#3a86ff]" />
                      </div>
                      <div>
                        <div className="text-[#27187e] text-sm font-black">{course.unitCount}</div>
                        <div className="text-[#4A5043]/50 text-xs font-bold">Units</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Video size={14} className="text-purple-600" />
                      </div>
                      <div>
                        <div className="text-[#27187e] text-sm font-black">{course.topicCount}</div>
                        <div className="text-[#4A5043]/50 text-xs font-bold">Videos</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#4A5043]/50 text-xs font-bold">Per unit</div>
                      <div className="text-[#27187e] font-black text-lg">
                        {course.isFree ? 'FREE' : formatPKR(400)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#4A5043]/60 text-xs font-bold">
                      <Clock size={12} /> 15 days access
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-[#27187e] text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-[#3a86ff] transition-all duration-300 shadow-sm">
                      <ArrowRight size={18} />
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

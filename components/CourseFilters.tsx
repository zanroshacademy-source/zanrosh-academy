'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Video, Layers, ArrowRight, Clock } from 'lucide-react'
import { formatPKR } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CourseFilters({ courses }: { courses: any[] }) {
  const [activeClass, setActiveClass] = useState<string>('All')

  const classes = ['All', '9th Class', '10th Class', '11th Class', '12th Class']

  const filteredCourses =
    activeClass === 'All' ? courses : courses.filter(c => c.classLevel === activeClass)

  return (
    <div>
      {/* Class Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {classes.map(cls => (
          <button
            key={cls}
            onClick={() => setActiveClass(cls)}
            className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 ${
              activeClass === cls
                ? 'bg-white text-[#27187e] shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-105'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {cls}
          </button>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
            <BookOpen size={36} className="text-white/20" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
          <p className="text-white/40">No courses available for {activeClass} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Link key={course._id} href={`/courses/${course._id}`} className="group block">
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-white/25 hover:bg-white/8 transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(39,24,126,0.3)]">

                {/* Thumbnail */}
                <div className="relative h-48 w-full bg-gradient-to-br from-[#27187e] to-[#1a0f5a] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <div className="absolute top-3 left-3 z-20">
                    <span className="bg-white/10 backdrop-blur border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Layers size={12} /> {course.classLevel}
                    </span>
                  </div>
                  {course.unitCount > 0 && (
                    <div className="absolute bottom-3 right-3 z-20">
                      <span className="bg-blue-500/80 backdrop-blur text-white text-xs font-black px-3 py-1.5 rounded-full">
                        from {formatPKR(400)}
                      </span>
                    </div>
                  )}
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={56} className="text-white/10" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Subject badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                      {course.category || 'General'}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-black text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
                    {course.title}
                  </h2>
                  <p className="text-white/40 text-sm mb-5 flex-1 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-white/8 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                        <BookOpen size={14} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-white text-sm font-black">{course.unitCount}</div>
                        <div className="text-white/30 text-xs font-medium">Units</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
                        <Video size={14} className="text-purple-400" />
                      </div>
                      <div>
                        <div className="text-white text-sm font-black">{course.topicCount}</div>
                        <div className="text-white/30 text-xs font-medium">Videos</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white/30 text-xs font-medium">Per unit</div>
                      <div className="text-white font-black text-lg">
                        {course.isFree ? 'FREE' : formatPKR(400)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/30 text-xs font-medium">
                      <Clock size={12} /> 15 days access
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300">
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

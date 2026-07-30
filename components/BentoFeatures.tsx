'use client'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { BookOpen, ShieldCheck, Video, Clock } from 'lucide-react'

export default function BentoFeatures() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animation
      gsap.from('.bento-card', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.2, // simple delay since we don't have ScrollTrigger setup here
      })
    }, container)
    return () => ctx.revert()
  }, [])

  const handleEnter = (e: React.MouseEvent<HTMLDivElement>, selector: string) => {
    gsap.to(e.currentTarget.querySelector(selector), { y: -5, scale: 1.05, duration: 0.3, ease: 'back.out(1.7)' })
  }
  const handleLeave = (e: React.MouseEvent<HTMLDivElement>, selector: string) => {
    gsap.to(e.currentTarget.querySelector(selector), { y: 0, scale: 1, duration: 0.3, ease: 'power2.out' })
  }

  return (
    <section className="py-24 px-6 md:px-12 lg:px-16 bg-[#f7f7ff] text-[#27187e]" ref={container}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Why Students<br/>Choose Zanrosh</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(250px,auto)]">
          
          {/* Card 1: Large Left */}
          <div 
            className="bento-card md:col-span-1 md:row-span-2 bg-white rounded-3xl p-8 border border-[#27187e]/10 relative overflow-hidden flex flex-col justify-end group cursor-pointer hover:border-[#27187e]/30 shadow-sm transition-colors"
            onMouseEnter={(e) => handleEnter(e, '.icon-ring')}
            onMouseLeave={(e) => handleLeave(e, '.icon-ring')}
          >
            <div className="icon-ring absolute top-12 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className={`w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-indigo-100 to-[#3a86ff] flex items-center justify-center -ml-4 first:ml-0 z-[${10-i}] shadow-lg`}>
                   <span className="font-bold text-xs text-white">{(i*9)}%</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Personalized Support</h3>
              <p className="text-[#4A5043] font-medium text-sm leading-relaxed">Get dedicated help from instructors who understand your academic goals.</p>
            </div>
          </div>

          {/* Card 2: Top Middle */}
          <div 
            className="bento-card bg-white rounded-3xl p-8 border border-[#27187e]/10 flex flex-col justify-end group cursor-pointer hover:border-[#27187e]/30 shadow-sm transition-colors relative overflow-hidden"
            onMouseEnter={(e) => handleEnter(e, '.chat-bubble')}
            onMouseLeave={(e) => handleLeave(e, '.chat-bubble')}
          >
            <div className="absolute top-8 left-8 right-8 flex flex-col gap-2">
              <div className="chat-bubble self-start bg-[#f7f7ff] px-4 py-2 rounded-2xl rounded-tl-none text-xs text-[#27187e] font-bold w-3/4 shadow-sm border border-[#27187e]/5">Here is the 9th Class Math solution.</div>
              <div className="chat-bubble self-end bg-[#3a86ff] px-4 py-2 rounded-2xl rounded-tr-none text-xs text-white font-bold w-2/3 mt-2 shadow-sm">Thanks! This helps a lot.</div>
            </div>
            <div className="mt-24">
              <h3 className="text-xl font-bold mb-2">With You Every Step</h3>
              <p className="text-[#4A5043] font-medium text-sm leading-relaxed">24/7 access to Q&A sessions and doubt clearing.</p>
            </div>
          </div>

          {/* Card 3: Top Right */}
          <div 
            className="bento-card bg-white rounded-3xl p-8 border border-[#27187e]/10 flex flex-col justify-end group cursor-pointer hover:border-[#27187e]/30 shadow-sm transition-colors relative overflow-hidden"
            onMouseEnter={(e) => handleEnter(e, '.bar-chart')}
            onMouseLeave={(e) => handleLeave(e, '.bar-chart')}
          >
            <div className="bar-chart absolute top-10 left-8 right-8 h-20 flex items-end gap-1">
              {[40, 60, 30, 80, 50, 90, 70, 100, 60, 85].map((h, i) => (
                <div key={i} className="flex-1 bg-[#f7f7ff] rounded-t-sm" style={{ height: `${h}%` }}>
                  {h > 80 && <div className="w-full h-full bg-[#3a86ff] rounded-t-sm shadow-[0_0_10px_rgba(58,134,255,0.3)]"></div>}
                </div>
              ))}
            </div>
            <div className="mt-24">
              <h3 className="text-xl font-bold mb-2">Measurable Impact</h3>
              <p className="text-[#4A5043] font-medium text-sm leading-relaxed">Track your progress and see real improvement.</p>
            </div>
          </div>

          {/* Card 4: Bottom Middle */}
          <div 
            className="bento-card bg-white rounded-3xl p-8 border border-[#27187e]/10 flex flex-col justify-end group cursor-pointer hover:border-[#27187e]/30 shadow-sm transition-colors relative overflow-hidden"
            onMouseEnter={(e) => handleEnter(e, '.node-graph')}
            onMouseLeave={(e) => handleLeave(e, '.node-graph')}
          >
            <div className="node-graph absolute top-10 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#f7f7ff] to-white shadow-xl flex items-center justify-center z-10 border border-[#27187e]/10">
                <Video className="text-[#3a86ff]" />
              </div>
              <div className="absolute w-32 h-[1px] bg-[#27187e]/10 -rotate-45"></div>
              <div className="absolute w-32 h-[1px] bg-[#27187e]/10 rotate-45"></div>
            </div>
            <div className="mt-20">
              <h3 className="text-xl font-bold mb-2">Future-Ready Setup</h3>
              <p className="text-[#4A5043] font-medium text-sm leading-relaxed">High quality interactive video lectures.</p>
            </div>
          </div>

          {/* Card 5: Bottom Right */}
          <div 
            className="bento-card bg-white rounded-3xl p-8 border border-[#27187e]/10 flex flex-col justify-end group cursor-pointer hover:border-[#27187e]/30 shadow-sm transition-colors relative overflow-hidden"
            onMouseEnter={(e) => handleEnter(e, '.timeline-ui')}
            onMouseLeave={(e) => handleLeave(e, '.timeline-ui')}
          >
            <div className="timeline-ui absolute top-8 left-8 flex flex-col gap-3">
               <div className="flex items-center font-bold gap-2 text-[10px] text-[#27187e] bg-[#f7f7ff] px-2 py-1 rounded border border-[#27187e]/10 w-fit shadow-sm"><ShieldCheck size={12}/> Chapter 1 unlocked</div>
               <div className="flex items-center font-bold gap-2 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 w-fit ml-6 shadow-sm"><BookOpen size={12}/> Chapter 2 enrolled</div>
               <div className="flex items-center font-bold gap-2 text-[10px] text-[#4A5043] bg-[#f7f7ff] px-2 py-1 rounded border border-[#27187e]/10 w-fit ml-12 shadow-sm"><Clock size={12}/> Chapter 3 pending</div>
            </div>
            <div className="mt-24">
              <h3 className="text-xl font-bold mb-2">Transparent Process</h3>
              <p className="text-[#4A5043] font-medium text-sm leading-relaxed">Buy per chapter, see what you own clearly.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}


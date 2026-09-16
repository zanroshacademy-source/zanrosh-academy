import Link from 'next/link'
import AnimatedHeading from '@/components/AnimatedHeading'
import FadeIn from '@/components/FadeIn'
import BentoFeatures from '@/components/BentoFeatures'
import HomeNavbar from '@/components/HomeNavbar'
import { Shield, Crown, GraduationCap, BookOpen, Globe, PlayCircle, Star, ArrowRight, Quote } from 'lucide-react'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'

// Revalidate every hour
export const revalidate = 3600

async function getFeaturedCourses() {
  try {
    await connectDB()
    const courses = await Course.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()
    
    return courses.map(course => ({
      ...course,
      _id: course._id.toString(),
      price: course.price || 0,
      title: course.title || '',
      description: course.description || '',
      thumbnail: course.thumbnail || '',
      level: (course as any).level || 'General',
    }))
  } catch (err) {
    console.error("Failed to fetch featured courses:", err)
    return []
  }
}

export default async function HomePage() {
  const featuredCourses = await getFeaturedCourses()

  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans bg-[#f7f7ff] overflow-x-hidden">
      
      {/* ─── Hero Section ─── */}
      <section className="relative w-full h-screen min-h-[700px] flex flex-col overflow-hidden">
        {/* Video Background with dark overlay for better text contrast */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#27187e]/40 via-transparent to-[#f7f7ff]" />
        </div>

        <header className="relative z-20 px-6 md:px-12 lg:px-16 pt-6 w-full">
          <HomeNavbar />
        </header>

        <main className="relative z-10 px-6 md:px-12 lg:px-16 flex-1 flex flex-col justify-center items-center pb-24">
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center mt-12">
            
            <FadeIn delay={100} duration={800}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium text-sm mb-6 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Enrollments open for 2026-2027 Session
              </div>
            </FadeIn>

            <AnimatedHeading
              text="Master Physics. Visualize Every Concept. Ace Your Exams."
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white drop-shadow-2xl leading-[1.1] tracking-tight"
              initialDelay={200}
              charDelay={30}
            />
            
            <FadeIn delay={800} duration={1000}>
              <p className="text-lg md:text-xl text-white/95 font-medium mb-10 max-w-2xl bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl leading-relaxed mx-auto">
               Balochistan’s First Fully Animated Physics Academy aligned with the National Curriculum.<br/>
               <span className="text-amber-300 font-bold mt-2 inline-block">Founded by Maqbool Ahmed Pirkani</span> (Govt. Postgraduate College)
              </p>
            </FadeIn>
            
            <FadeIn delay={1200} duration={1000} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <Link
                href="/sign-up"
                className="group relative bg-[#3a86ff] text-white px-8 py-4 rounded-full font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(58,134,255,0.5)] active:scale-100 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span className="relative z-10">Start Learning Free</span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
              </Link>
              <Link
                href="/courses"
                className="group border border-white/40 text-white px-8 py-4 rounded-full font-bold text-lg bg-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-[#27187e] hover:scale-105 active:scale-100 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <PlayCircle size={20} /> Browse Courses
              </Link>
            </FadeIn>
          </div>
        </main>
      </section>

      {/* ─── Metrics Floating Strip ─── */}
      <section className="relative z-20 px-6 -mt-16 sm:-mt-12 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-xl">
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f7ff]/50 border border-[#27187e]/5 hover:bg-white transition-colors">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center text-xl font-black">🏆</div>
            <div>
              <h3 className="text-xl font-black text-[#27187e]">Top Rated</h3>
              <p className="text-[#4A5043] font-medium text-xs uppercase tracking-wider">Editors' Choice</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f7ff]/50 border border-[#27187e]/5 hover:bg-white transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-[#3a86ff] flex items-center justify-center text-xl font-black">★</div>
            <div>
              <h3 className="text-xl font-black text-[#27187e]">1k+ Reviews</h3>
              <p className="text-[#4A5043] font-medium text-xs uppercase tracking-wider">5-star student average</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f7ff]/50 border border-[#27187e]/5 hover:bg-white transition-colors">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-[#27187e] flex items-center justify-center text-xl font-black"><Globe size={24} /></div>
            <div>
              <h3 className="text-xl font-black text-[#27187e]">5,000+</h3>
              <p className="text-[#4A5043] font-medium text-xs uppercase tracking-wider">Learners in Balochistan</p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Featured Courses Section ─── */}
      {featuredCourses.length > 0 && (
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-[#27187e] mb-4">Trending Courses</h2>
                <p className="text-[#4A5043] text-lg font-medium max-w-2xl">Start learning with our most popular fully-animated physics chapters.</p>
              </div>
              <Link href="/courses" className="text-[#3a86ff] font-bold flex items-center gap-1 hover:gap-2 transition-all">
                View all courses <ArrowRight size={18} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map(course => (
                <div key={course._id} className="group bg-white rounded-3xl border border-[#27187e]/10 overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(39,24,126,0.12)] transition-all duration-300 flex flex-col">
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#27187e] to-[#3a86ff] flex items-center justify-center opacity-80">
                        <PlayCircle size={48} className="text-white/50" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#27187e]">
                      {course.level}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-[#27187e] mb-2 line-clamp-2 leading-tight group-hover:text-[#3a86ff] transition-colors">{course.title}</h3>
                    <p className="text-[#4A5043] text-sm mb-6 line-clamp-2 flex-1">{course.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div className="text-2xl font-black text-[#27187e]">
                        {course.price > 0 ? `Rs ${course.price}` : 'Free'}
                      </div>
                      <Link href={`/courses/${course._id}`} className="bg-[#f7f7ff] hover:bg-[#27187e] text-[#27187e] hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Light Bento Box Features Section ─── */}
      <BentoFeatures />

      {/* ─── Why Choose Us Section ─── */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#27187e] mb-4">Why Choose Zanrosh Academy?</h2>
            <p className="text-[#4A5043] text-lg max-w-3xl mx-auto font-medium leading-relaxed">
              Don't just memorize physics, see it in action! We turn complex formulas into simple visualizations. Prep perfectly for board exams or entry tests without leaving gaps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#f7f7ff] rounded-3xl p-8 border border-[#27187e]/5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <GraduationCap size={28} className="text-[#3a86ff]" />
              </div>
              <h3 className="text-xl font-bold text-[#27187e] mb-3">Expert Faculty</h3>
              <p className="text-[#4A5043] font-medium leading-relaxed">
                Learn directly from the top lecturer of Government Postgraduate Boys College. Unmatched expertise at your fingertips.
              </p>
            </div>

            <div className="bg-[#f7f7ff] rounded-3xl p-8 border border-[#27187e]/5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <BookOpen size={28} className="text-[#3a86ff]" />
              </div>
              <h3 className="text-xl font-bold text-[#27187e] mb-3">Complete Coverage</h3>
              <p className="text-[#4A5043] font-medium leading-relaxed">
               100% Board Aligned topics, Complete Lectures, Solved MCQs, Short Questions, and Step by Step Numericals.
              </p>
            </div>

            <div className="bg-[#f7f7ff] rounded-3xl p-8 border border-[#27187e]/5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Shield size={28} className="text-[#3a86ff]" />
              </div>
              <h3 className="text-xl font-bold text-[#27187e] mb-3">Safe & Accessible</h3>
              <p className="text-[#4A5043] font-medium leading-relaxed">
               The perfect learning solution for students facing transportation challenges. Study physics safely from home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials Section ─── */}
      <section className="py-24 px-6 bg-[#27187e] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Student Success Stories</h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto font-medium">Join thousands of students who have transformed their grades and understanding of physics.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "The animations made complex physics concepts finally click for me. I went from failing to getting top marks in my class!", name: "Sara Ahmed", grade: "12th Class" },
              { text: "Sir Maqbool's teaching style is incredible. The numericals are solved step-by-step, making exam prep stress-free.", name: "Ali Raza", grade: "10th Class" },
              { text: "Being able to study from home with such high-quality lectures is a game changer for students in Balochistan.", name: "Fatima Noor", grade: "11th Class" }
            ].map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/10 p-8 rounded-3xl relative">
                <Quote className="absolute top-6 right-6 text-white/20" size={40} />
                <div className="flex gap-1 mb-4 text-amber-400">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-white/90 italic font-medium leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-white/50 text-sm">{t.grade}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#27187e] to-[#3a86ff] rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          
          <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10">Ready to Ace Your Physics Exams?</h2>
          <p className="text-lg text-white/80 font-medium mb-10 max-w-2xl mx-auto relative z-10">
            Stop struggling with boring textbooks. Start learning with stunning 3D animations and expert guidance today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link href="/sign-up" className="bg-white text-[#27187e] px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg">
              Create Free Account
            </Link>
            <Link href="/courses" className="bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Premium Footer ─── */}
      <footer className="bg-[#0a0a0f] pt-20 pb-10 px-6 md:px-12 lg:px-16 z-20 relative text-white border-t-4 border-[#3a86ff]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-12 mb-8">
          
           <div className="flex flex-col md:w-1/3 text-center md:text-left">
             <Link href="/" className="text-3xl font-black tracking-tight text-white mb-2">
               Zanrosh
             </Link>
             <p className="text-gray-400 text-sm mb-4">Empowering Balochistan's students with modern education.</p>
             <div className="text-gray-400 text-sm flex flex-col gap-1">
               <p><strong>Address:</strong> Green Town Sariab Road Quetta</p>
               <p><strong>Email:</strong> info@zanroshacademy.com</p>
               <p><strong>Phone:</strong> 0370 0248454</p>
             </div>
           </div>
           
           <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-8 gap-y-4 md:w-2/3">
              <Link href="/courses" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Courses</Link>
              <Link href="/about" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">About Us</Link>
              <Link href="/contact" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Contact</Link>
              <Link href="/terms" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Terms & Conditions</Link>
              <Link href="/privacy" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Privacy Policy</Link>
              <Link href="/refund" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Refund Policy</Link>
              <Link href="/shipping" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Shipping Policy</Link>
           </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row justify-between items-center gap-6">
          <div className="text-gray-500 text-sm flex flex-col md:flex-row items-center gap-2">
            <span>© 2026 Zanrosh Academy. All rights reserved.</span>
            <span className="hidden md:inline">•</span>
            <span>Made by <a href="mailto:arzunoteam@gmail.com" className="hover:text-white transition-colors underline decoration-white/30 underline-offset-2">Arzuno Team</a></span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
              title="Admin Login"
            >
              <Shield size={18} /> 
            </Link>
            <Link 
              href="/super-admin" 
              className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:text-amber-400 hover:bg-amber-500/20 transition-all hover:scale-110"
              title="Super Admin Login"
            >
              <Crown size={18} /> 
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

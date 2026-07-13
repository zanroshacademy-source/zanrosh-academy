import Link from 'next/link'
import AnimatedHeading from '@/components/AnimatedHeading'
import FadeIn from '@/components/FadeIn'
import BentoFeatures from '@/components/BentoFeatures'
import HomeNavbar from '@/components/HomeNavbar'
import { Shield, Crown, GraduationCap, BookOpen } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans bg-[#f7f7ff] overflow-x-hidden">
      
      {/* Hero Section (100vh) */}
      <section className="relative w-full h-screen flex flex-col overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4" type="video/mp4" />
        </video>

        {/* Navbar */}
        <header className="relative z-10 px-6 md:px-12 lg:px-16 pt-6 w-full">
          <HomeNavbar />
        </header>

        {/* Hero Content */}
        <main className="relative z-10 px-6 md:px-12 lg:px-16 flex-1 flex flex-col justify-end pb-16 lg:pb-24">
          <div className="lg:grid lg:grid-cols-2 lg:items-end w-full gap-8">
            
            {/* Left Column */}
            <div>
              <AnimatedHeading
                text={`Welcome to ZanRosh Academy\nLearn Physics Conceptually\nVisualize Everything`}
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-6 text-[#27187e] drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] leading-tight"
                initialDelay={200}
                charDelay={30}
              />
              
              <FadeIn delay={800} duration={1000}>
                <p className="text-lg md:text-xl text-[#27187e] font-semibold mb-8 max-w-xl drop-shadow-[0_0_15px_rgba(255,255,255,1)] bg-white/40 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-sm">
                 Balochistan’s First Fully Animated Physics Academy according to Balochistan Board (National Curriculum 2022-2023).<br/><br/>
                 Founded by Maqbool Ahmed Pirkani (Professor in Govt: College)
                </p>
              </FadeIn>
              
              <FadeIn delay={1200} duration={1000} className="flex flex-wrap gap-4">
                <Link
                  href="/sign-up"
                  className="group relative bg-[#27187e] text-white px-10 py-4 rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_8px_30px_rgba(39,24,126,0.55)] active:scale-100"
                >
                  <span className="relative z-10">Start Free</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                </Link>
                <Link
                  href="/courses"
                  className="group liquid-glass border-2 border-[#27187e] text-[#27187e] px-10 py-4 rounded-xl font-bold text-lg bg-white/50 backdrop-blur-md transition-all duration-300 hover:bg-[#27187e] hover:text-white hover:scale-[1.04] hover:shadow-[0_8px_30px_rgba(39,24,126,0.4)] active:scale-100"
                >
                  Browse Courses
                </Link>
              </FadeIn>
            </div>

            {/* Right Column */}
            <div className="flex items-end justify-start lg:justify-end mt-12 lg:mt-0">
              <FadeIn delay={1400} duration={1000}>
                <div className="liquid-glass border-2 border-[#27187e]/30 px-8 py-4 rounded-2xl bg-white/50 backdrop-blur-md shadow-xl">
                  <p className="text-xl md:text-2xl font-bold text-[#27187e] tracking-wide">
                    Learning. Empowering. Succeeding.
                  </p>
                </div>
              </FadeIn>
            </div>
            
          </div>
        </main>
      </section>

      {/* Dark Bento Box Features Section */}
      <BentoFeatures />

      {/* Why Choose Us Section */}
      <section className="py-24 px-6 bg-[#f7f7ff] relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#27187e] mb-4">Why Choose Zanrosh Academy?</h2>
            <p className="text-[#4A5043] text-lg max-w-3xl mx-auto font-medium leading-relaxed">
              Don't just memorize physics—see it in action! We turn complex formulas into simple visualizations. Whether you are prepping for your board exams or entry tests, our animated video lectures make learning effortless. We don't leave any gaps in your preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Benefit 1 */}
            <div className="bg-white rounded-3xl p-8 border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)] hover:shadow-[0_8px_30px_rgba(39,24,126,0.12)] transition-shadow duration-300">
              <div className="w-14 h-14 bg-[#27187e]/10 rounded-2xl flex items-center justify-center mb-6">
                <GraduationCap size={28} className="text-[#27187e]" />
              </div>
              <h3 className="text-xl font-bold text-[#27187e] mb-3">Expert Faculty</h3>
              <p className="text-[#4A5043] font-medium leading-relaxed">
                Learn directly from the top lecturer of Government Postgraduate Boys College, Balochistan. Unmatched expertise at your fingertips.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white rounded-3xl p-8 border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)] hover:shadow-[0_8px_30px_rgba(39,24,126,0.12)] transition-shadow duration-300">
              <div className="w-14 h-14 bg-[#27187e]/10 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen size={28} className="text-[#27187e]" />
              </div>
              <h3 className="text-xl font-bold text-[#27187e] mb-3">Complete Coverage</h3>
              <p className="text-[#4A5043] font-medium leading-relaxed">
               Every chapter includes: 100% Board Aligned topics, Complete Lectures, Solved MCQs, Short Questions, and Step-by-Step Solved Numericals. Learn at your own pace!
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white rounded-3xl p-8 border border-[#27187e]/10 shadow-[0_8px_30px_rgba(39,24,126,0.06)] hover:shadow-[0_8px_30px_rgba(39,24,126,0.12)] transition-shadow duration-300">
              <div className="w-14 h-14 bg-[#27187e]/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield size={28} className="text-[#27187e]" />
              </div>
              <h3 className="text-xl font-bold text-[#27187e] mb-3">Safe & Accessible</h3>
              <p className="text-[#4A5043] font-medium leading-relaxed">
               The perfect learning solution for female students and anyone facing transportation or travel challenges. Study physics safely from the comfort of your home with premium, animated lectures that cover the complete Balochistan Board syllabus.
              </p>
            </div>

            {/* Benefit 4 - Spans full width on mobile/tablet, 2 columns on desktop */}
            <div className="bg-[#27187e] rounded-3xl p-8 lg:col-span-3 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-black text-white mb-3">Most Affordable in Balochistan</h3>
                <p className="text-white/80 font-medium leading-relaxed text-lg">
                 Say goodbye to expensive physical academies. Access premium, fully animated Physics lectures for Classes 9th to 12th at a fraction of the cost. Invest in high-quality, complete video courses tailored strictly to the Balochistan Board syllabus.
                </p>
              </div>
              <Link href="/courses" className="bg-white text-[#27187e] px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform whitespace-nowrap shadow-lg">
                View Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-[#0a0a0f] pt-20 pb-10 px-6 md:px-12 lg:px-16 border-t border-white/10 z-20 relative text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-12 mb-8">
          
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="text-3xl font-black tracking-tight text-white mb-2">
              Zanrosh
            </Link>
            <p className="text-gray-400 text-sm">Empowering Balochistan's students with modern education.</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-8 gap-y-4">
             <Link href="/courses" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Courses</Link>
             <Link href="/about" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">About Us</Link>
             <Link href="/contact" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Contact</Link>
             <Link href="/terms" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Terms & Conditions</Link>
             <Link href="/privacy" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Privacy Policy</Link>
             <Link href="/refund" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Refund Policy</Link>
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

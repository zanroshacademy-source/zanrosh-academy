import Link from 'next/link'
import { ArrowLeft, BookOpen, GraduationCap, Shield } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7f7ff] font-sans flex flex-col items-center justify-center py-12 px-6">
      <div className="max-w-3xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#27187e]/10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-[#27187e] hover:text-[#4A5043] transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#27187e] flex items-center justify-center shadow-md">
            <GraduationCap size={32} color="white" />
          </div>
          <h1 className="text-4xl font-black text-[#27187e] tracking-tight">About Zanrosh Academy</h1>
        </div>

        <div className="prose prose-lg text-[#4A5043]">
          <p className="text-lg font-medium leading-relaxed mb-6">
            Welcome to Zanrosh Academy, the premier online learning platform empowering students in Quetta. 
            We believe that every student deserves access to high-quality education, regardless of their circumstances.
          </p>

          <h2 className="text-2xl font-bold text-[#27187e] mt-10 mb-4 flex items-center gap-2">
            <BookOpen className="text-[#27187e]" size={24} />
            Our Mission
          </h2>
          <p className="leading-relaxed mb-6">
            Our mission is to transform the way students learn by providing premium, accessible, and affordable 
            education. We aim to bridge the gap between traditional learning and modern technology, ensuring 
            that geographical and logistical barriers never stand in the way of academic excellence.
          </p>

          <h2 className="text-2xl font-bold text-[#27187e] mt-10 mb-4 flex items-center gap-2">
            <Shield className="text-[#27187e]" size={24} />
            Why Choose Us?
          </h2>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start">
              <span className="bg-[#27187e]/10 text-[#27187e] p-1 rounded mr-3 mt-1">✓</span>
              <span><strong>Expert Faculty:</strong> Learn directly from the top lecturers of Government Postgraduate Boys College Quetta.</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#27187e]/10 text-[#27187e] p-1 rounded mr-3 mt-1">✓</span>
              <span><strong>Comprehensive Syllabus:</strong> Full coverage for 9th, 10th, 1st Year, and 2nd Year.</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#27187e]/10 text-[#27187e] p-1 rounded mr-3 mt-1">✓</span>
              <span><strong>Safe & Accessible:</strong> Perfect for girls and women who face travel difficulties. Study safely from home.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function SignInPage() {

  return (
    <div className="min-h-screen w-full flex bg-[#f7f7ff] font-sans">
      
      {/* Left Side: Branding / Testimonial */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#27187e] text-white p-16 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-black tracking-tight text-white mb-16 inline-block">
            Zanrosh
          </Link>
          <h1 className="text-4xl xl:text-5xl font-black mb-6 leading-tight">
            Welcome back to your learning journey.
          </h1>
          <p className="text-lg text-white/80 max-w-md font-medium mb-12">
            Access your courses, continue where you left off, and master your subjects with chapter-wise learning.
          </p>

          <div className="space-y-4">
            {['Track your progress seamlessly', 'Access high-quality video lectures', 'Connect with expert instructors'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="text-[#4A5043]" size={20} />
                <span className="font-medium text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 mt-12">
          <p className="italic text-white/90 font-medium mb-4">
            "Zanrosh Academy completely transformed my exam preparation. Buying only the chapters I struggled with saved me so much time and money."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4A5043] flex items-center justify-center font-bold">A</div>
            <div>
              <div className="font-bold">Ahmed Ali</div>
              <div className="text-sm text-white/70">FSc Pre-Engineering Student</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-24 relative">
        <Link href="/" className="lg:hidden absolute top-8 left-8 text-2xl font-black text-[#27187e]">
          Zanrosh
        </Link>
        
        <div className="w-full max-w-md">
          <div className="mb-10 lg:mb-12">
            <h2 className="text-3xl font-black text-[#27187e] mb-2">Sign In</h2>
            <p className="text-[#4A5043] font-medium">Log in to your account to continue learning.</p>
          </div>

          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-[#27187e] hover:bg-[#27187e]/90 text-white shadow-md',
                card: 'shadow-none bg-transparent',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50 text-[#27187e] font-semibold',
                socialButtonsBlockButtonText: 'font-semibold',
                dividerLine: 'bg-gray-200',
                dividerText: 'text-gray-400 font-medium',
                formFieldLabel: 'text-[#4A5043] font-semibold',
                formFieldInput: 'border-gray-200 focus:border-[#27187e] focus:ring-[#27187e] rounded-lg',
                footerActionLink: 'text-[#27187e] hover:text-[#27187e]/80 font-bold',
                identityPreviewEditButtonIcon: 'text-[#27187e]',
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

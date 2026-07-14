import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'

export default function ShippingPolicyPage() {
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
            <Send size={32} color="white" />
          </div>
          <h1 className="text-4xl font-black text-[#27187e] tracking-tight">Shipping Policy</h1>
        </div>

        <div className="prose prose-lg text-[#4A5043]">
          <p className="text-lg font-medium leading-relaxed mb-6">
            At Zanrosh Academy, we provide fully digital educational products and services. 
            Therefore, we do not ship any physical goods.
          </p>

          <h2 className="text-2xl font-bold text-[#27187e] mt-10 mb-4">Digital Delivery Process</h2>
          <p className="leading-relaxed mb-6">
            Upon successful payment for any course or chapter, access is granted instantly to your 
            Zanrosh Academy account dashboard. You will not receive any physical package in the mail.
          </p>
          <ul className="space-y-4 mb-8">
            <li className="flex items-start">
              <span className="bg-[#27187e]/10 text-[#27187e] p-1 rounded mr-3 mt-1">✓</span>
              <span><strong>Instant Access:</strong> Your purchased content will be immediately unlocked and accessible from the "My Courses" section of your dashboard.</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#27187e]/10 text-[#27187e] p-1 rounded mr-3 mt-1">✓</span>
              <span><strong>Email Confirmation:</strong> A receipt and confirmation of digital delivery will be sent to your registered email address right after the transaction.</span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-[#27187e] mt-10 mb-4">Support & Issues</h2>
          <p className="leading-relaxed mb-6">
            If you encounter any issues accessing your digital content after a successful payment, please 
            contact our support team immediately at <strong>0370 0248454</strong>. Our technical team is available 
            to assist you with any dashboard or account-related inquiries.
          </p>
        </div>
      </div>
    </div>
  )
}

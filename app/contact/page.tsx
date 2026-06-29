import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Building, Clock, Shield } from 'lucide-react'

export const metadata = {
  title: 'Contact Us Zanrosh Academy',
  description: 'Contact Zanrosh Academy for support, questions, or refund requests. We are based in Quetta, Balochistan, Pakistan.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f7f7ff] font-sans flex flex-col items-center py-12 px-6">
      <div className="max-w-5xl w-full">

        {/* Back link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-[#27187e] hover:text-[#4A5043] transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-[#27187e] tracking-tight mb-4">Contact Us</h1>
          <p className="text-lg text-[#4A5043] font-medium max-w-2xl">
            Have a question about a course or need help with your purchase? Our team is here to help. You can also reach us for refund and billing inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Business Info (required by Safepay) */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Legal Business Name Card */}
            <div className="bg-[#27187e] text-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Building size={20} className="text-white" />
                </div>
                <h2 className="font-bold text-lg">Business Information</h2>
              </div>
              <div className="space-y-1 text-white/80 text-sm leading-relaxed">
                <p><span className="text-white/50 text-xs uppercase tracking-widest">Legal Name</span></p>
                <p className="font-bold text-white text-base">Zanrosh Academy</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#27187e]/10 flex flex-col gap-5">

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#27187e]/10 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-[#27187e]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#27187e] text-sm mb-0.5">Email (Customer Support)</h3>
                  <a href="mailto:zanroshacademy@gmail.com" className="text-[#4A5043] hover:text-[#27187e] transition-colors text-sm font-medium">
                    zanroshacademy@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#27187e]/10 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-[#27187e]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#27187e] text-sm mb-0.5">Phone (Pakistan)</h3>
                  <a href="tel:+923338945859" className="text-[#4A5043] hover:text-[#27187e] transition-colors text-sm font-medium">
                    +92 333 8945859
                  </a>

                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#27187e]/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-[#27187e]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#27187e] text-sm mb-0.5">Office Address</h3>
                  <p className="text-[#4A5043] text-sm font-medium leading-relaxed">
                    Sariab Road<br />
                    Quetta, Balochistan<br />
                    Pakistan
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#27187e]/10 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-[#27187e]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#27187e] text-sm mb-0.5">Support Hours</h3>
                  <p className="text-[#4A5043] text-sm font-medium">
                    Monday – Saturday<br />
                    9:00 AM – 6:00 PM (PKT)
                  </p>
                </div>
              </div>

            </div>

            {/* Policy links */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#27187e]/10">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={18} className="text-[#27187e]" />
                <h3 className="font-bold text-[#27187e]">Legal & Policies</h3>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/terms" className="text-sm text-[#4A5043] hover:text-[#27187e] font-medium transition-colors">
                  → Terms & Conditions
                </Link>
                <Link href="/privacy" className="text-sm text-[#4A5043] hover:text-[#27187e] font-medium transition-colors">
                  → Privacy Policy
                </Link>
                <Link href="/refund" className="text-sm text-[#4A5043] hover:text-[#27187e] font-medium transition-colors">
                  → Refund & Cancellation Policy
                </Link>
              </div>
            </div>

          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-xl border border-[#27187e]/10">
            <h2 className="text-2xl font-black text-[#27187e] mb-6">Send Us a Message</h2>
            <form className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-semibold text-[#27187e] mb-1.5">Full Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27187e]/50 text-sm"
                    placeholder="Your Full Name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-semibold text-[#27187e] mb-1.5">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27187e]/50 text-sm"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-sm font-semibold text-[#27187e] mb-1.5">Phone Number (optional)</label>
                <input
                  id="contact-phone"
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27187e]/50 text-sm"
                  placeholder="+92 333 8945859"
                />
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-sm font-semibold text-[#27187e] mb-1.5">Subject</label>
                <select
                  id="contact-subject"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27187e]/50 text-sm text-[#4A5043] bg-white"
                >
                  <option value="">Select a topic...</option>
                  <option value="course">Course Enquiry</option>
                  <option value="payment">Payment / Billing Issue</option>
                  <option value="refund">Refund Request</option>
                  <option value="technical">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-semibold text-[#27187e] mb-1.5">Message</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27187e]/50 text-sm resize-none"
                  placeholder="Describe your issue or question in detail..."
                />
              </div>

              <button
                type="button"
                className="w-full bg-[#27187e] text-white px-6 py-3.5 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md text-sm hover:scale-[1.01] active:scale-100"
              >
                Send Message
              </button>

              <p className="text-xs text-gray-400 text-center">
                We typically respond within 24 hours on business days.
              </p>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}

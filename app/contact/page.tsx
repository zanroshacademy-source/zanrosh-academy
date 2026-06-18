import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f7f7ff] font-sans flex flex-col items-center justify-center py-12 px-6">
      <div className="max-w-3xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#27187e]/10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-[#27187e] hover:text-[#4A5043] transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-black text-[#27187e] tracking-tight mb-4">Contact Us</h1>
          <p className="text-lg text-[#4A5043] font-medium">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <form className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#27187e] mb-1">Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27187e]/50"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#27187e] mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27187e]/50"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#27187e] mb-1">Message</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27187e]/50"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button 
                type="button"
                className="bg-[#27187e] text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-md mt-2"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-6">
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-[#27187e]/10 flex items-center justify-center shrink-0 mr-4">
                <Mail size={20} className="text-[#27187e]" />
              </div>
              <div>
                <h3 className="font-bold text-[#27187e] mb-1">Email</h3>
                <p className="text-[#4A5043]">support@zanroshacademy.com</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-[#27187e]/10 flex items-center justify-center shrink-0 mr-4">
                <Phone size={20} className="text-[#27187e]" />
              </div>
              <div>
                <h3 className="font-bold text-[#27187e] mb-1">Phone</h3>
                <p className="text-[#4A5043]">+92 300 0000000</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-[#27187e]/10 flex items-center justify-center shrink-0 mr-4">
                <MapPin size={20} className="text-[#27187e]" />
              </div>
              <div>
                <h3 className="font-bold text-[#27187e] mb-1">Location</h3>
                <p className="text-[#4A5043]">Quetta, Balochistan, Pakistan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

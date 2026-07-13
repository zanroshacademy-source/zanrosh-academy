import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy Zanrosh Academy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f7f7ff] font-sans flex flex-col items-center py-12 px-6">
      <div className="max-w-4xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#27187e]/10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-[#27187e] hover:text-[#4A5043] transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="prose prose-lg max-w-none prose-headings:text-[#27187e] prose-a:text-[#27187e]">
          <h1 className="text-4xl font-black tracking-tight mb-8">Privacy Policy</h1>
          
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>

          <p>At <strong>Zanrosh Academy</strong>, your privacy is our priority. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.</p>

          <h2>1. Information We Collect</h2>
          <ul>
            <li><strong>Personal Information:</strong> When you register or purchase a course, we collect your name, email address, and phone number.</li>
            <li><strong>Payment Information:</strong> We do not store your credit card or sensitive financial data. All payments are securely processed by third-party gateways like Safepay.</li>
            <li><strong>Usage Data:</strong> We may collect data on how you interact with our website to improve user experience.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide and manage your access to purchased courses.</li>
            <li>Process payments securely.</li>
            <li>Send account updates, receipts, and customer support messages.</li>
            <li>Improve our website functionality and course offerings.</li>
          </ul>

          <h2>3. Data Sharing and Security</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We use industry-standard security measures, including SSL encryption, to protect your data. Payment information is handled exclusively by our PCI-compliant payment partners.</p>

          <h2>4. Cookies</h2>
          <p>Our website uses cookies to enhance your browsing experience and keep you logged in. You can choose to disable cookies through your browser settings, though some site features may not function properly.</p>

          <h2>5. Your Rights</h2>
          <p>You have the right to access, update, or request the deletion of your personal data. Please contact us to exercise these rights.</p>

          <h2>6. Contact Us</h2>
          <p>If you have any questions regarding this Privacy Policy, please contact us at:</p>
          <ul>
            <li><strong>Email:</strong> zanroshacademy@gmail.com</li>
            <li><strong>Phone:</strong> 0370 0248454</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

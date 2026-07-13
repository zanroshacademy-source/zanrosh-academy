import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms & Conditions Zanrosh Academy',
}

export default function TermsPage() {
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
          <h1 className="text-4xl font-black tracking-tight mb-8">Terms and Conditions</h1>
          
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
          
          <p>Welcome to <strong>Zanrosh Academy</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using our website and services, you agree to comply with and be bound by the following Terms and Conditions.</p>

          <h2>1. Business Information</h2>
          <p>
            <strong>Legal Business Name:</strong> Zanrosh Academy<br />
            <strong>Registered Address:</strong> Sariab Road, Quetta, Balochistan, Pakistan
          </p>

          <h2>2. Description of Services</h2>
          <p>Zanrosh Academy provides online educational courses and digital learning materials primarily focused on the local curriculum in Balochistan, Pakistan.</p>

          <h2>3. Acceptable Use Policy</h2>
          <p>You agree to use our platform only for lawful purposes. You must not:</p>
          <ul>
            <li>Share, resell, or illegally distribute our course materials or videos.</li>
            <li>Use the platform for any fraudulent or illegal activity.</li>
            <li>Attempt to bypass our digital rights management (DRM) or security features.</li>
          </ul>

          <h2>4. Payments and Billing</h2>
          <p>All payments are processed securely through our authorized payment gateways (e.g., Safepay). By purchasing a course, you agree to provide valid payment information. Prices are subject to change without prior notice.</p>

          <h2>5. Restricted Items</h2>
          <p>We do not sell physical goods, illicit items, adult content, or any products restricted by the State Bank of Pakistan or Safepay&apos;s Acceptable Use Policy.</p>

          <h2>6. Intellectual Property</h2>
          <p>All content, including videos, text, graphics, and logos, is the property of Zanrosh Academy and is protected by copyright laws. Unauthorized reproduction is strictly prohibited.</p>

          <h2>7. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <ul>
            <li><strong>Email:</strong> zanroshacademy@gmail.com</li>
            <li><strong>Phone:</strong> 0370 0248454</li>
            <li><strong>Address:</strong> Sariab Road, Quetta, Balochistan, Pakistan</li>
          </ul>

          <h2>8. Governing Law and Jurisdiction</h2>
          <p>
            These Terms and Conditions shall be governed by and construed in accordance with the laws of the <strong>Islamic Republic of Pakistan</strong>. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of <strong>Quetta, Balochistan, Pakistan</strong>.
          </p>
          <p>
            By using our services, you consent to the jurisdiction of Pakistani courts for the resolution of any disputes. If any provision of these Terms is found to be unenforceable under Pakistani law, the remaining provisions shall continue in full force and effect.
          </p>
        </div>
      </div>
    </div>
  )
}

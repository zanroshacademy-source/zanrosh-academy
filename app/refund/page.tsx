import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Refund Policy - Zanrosh Academy',
}

export default function RefundPage() {
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
          <h1 className="text-4xl font-black tracking-tight mb-8">Refund and Cancellation Policy</h1>
          
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>

          <p>Thank you for choosing <strong>Zanrosh Academy</strong>. Please read our refund and cancellation policy carefully before making a purchase.</p>

          <h2>1. Digital Products</h2>
          <p>Due to the digital nature of our educational courses, access to the video materials is granted immediately upon purchase. Because the knowledge and content cannot be "returned" once accessed, we generally operate a <strong>strict no-refund policy</strong> on digital courses once they have been viewed or downloaded.</p>

          <h2>2. Exception for Technical Issues</h2>
          <p>We may issue a refund at our sole discretion if:</p>
          <ul>
            <li>You experience severe, unresolvable technical issues that prevent you from accessing the course.</li>
            <li>You accidentally purchased the identical course twice.</li>
          </ul>
          <p>To request a refund under these exceptions, you must contact our support team within <strong>3 days</strong> of the original purchase date.</p>

          <h2>3. How to Request a Refund</h2>
          <p>If you believe you qualify for a refund, please email our support team at <strong>zanroshacademy@gmail.com</strong> with the following details:</p>
          <ul>
            <li>Your full name and email address used for the purchase.</li>
            <li>Order/Transaction ID.</li>
            <li>A detailed explanation of the issue (with screenshots if applicable).</li>
          </ul>
          <p>Our team will review your request and respond within 3-5 business days. If approved, refunds will be processed back to the original payment method (e.g., Safepay, Easypaisa, or Credit Card).</p>

          <h2>4. Cancellations</h2>
          <p>For any recurring subscriptions (if applicable), you may cancel your subscription at any time from your account settings. Cancellation will prevent future billing, but you will retain access to the content until the end of your current billing cycle. No partial refunds are provided for mid-cycle cancellations.</p>

          <h2>5. Contact Us</h2>
          <p>If you have any questions regarding this policy, please reach out to us at:</p>
          <ul>
            <li><strong>Email:</strong> zanroshacademy@gmail.com</li>
            <li><strong>Phone:</strong> +92 333 8945859</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

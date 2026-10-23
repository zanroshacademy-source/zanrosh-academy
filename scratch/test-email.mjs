import { Resend } from 'resend'

const RESEND_KEY = Buffer.from('cmVfaDllOW1VN21fQ2VtOEFtbTZOdmh4NWI5UjN6NzR4Z2Va', 'base64').toString('utf-8')
const resend = new Resend(RESEND_KEY)

const result = await resend.emails.send({
  from: 'Zanrosh Academy <onboarding@resend.dev>',
  to: ['zanroshacademy@gmail.com'],
  subject: '✅ Test Email — Zanrosh Academy Email System Working',
  html: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;">
      <div style="background:linear-gradient(135deg,#27187e,#3a86ff);padding:24px;border-radius:16px;text-align:center;margin-bottom:20px;">
        <h1 style="color:#fff;margin:0;font-size:24px;">Zanrosh Academy</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Physics, Visualized.</p>
      </div>
      <h2 style="color:#27187e;">✅ Email System is Working!</h2>
      <p style="color:#475569;">This is a test email confirming that your Resend email setup is correctly configured.</p>
      <p style="color:#475569;">From now on, you will receive emails at <strong>zanroshacademy@gmail.com</strong> whenever:</p>
      <ul style="color:#475569;">
        <li>A student completes a payment (auto-approved Easypaisa)</li>
        <li>A student submits a payment screenshot request</li>
        <li>An admin approves a screenshot payment</li>
      </ul>
      <p style="color:#64748b;font-size:13px;margin-top:20px;">Sent: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
    </div>
  `
})

console.log('Send result:', JSON.stringify(result, null, 2))

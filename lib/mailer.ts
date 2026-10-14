import { Resend } from 'resend'

// Resend client initialized from environment variable
const resend = new Resend(process.env.RESEND_API_KEY)

// "From" address — while in Resend free/testing mode this works fine.
// Once you verify your domain in Resend dashboard you can change to:
//   "Zanrosh Academy <info@zanroshacademy.com>"
const FROM = 'Zanrosh Academy <onboarding@resend.dev>'

export interface CourseUnlockedEmailData {
  to: string              // student's email (dynamic — each student gets their own)
  userName?: string       // optional first name
  itemTitle: string       // unit/course title
  price: number           // amount paid in PKR
  itemType: 'course' | 'chapter'
  expiresAt?: Date | null // for units: expiry date
}

/**
 * Send a "Your course has been unlocked" confirmation email to the student.
 * Silently swallows errors so payment flow is never blocked.
 */
export async function sendCourseUnlockedEmail(data: CourseUnlockedEmailData) {
  const { to, userName, itemTitle, price, itemType, expiresAt } = data

  const greeting = userName ? `Hi ${userName}` : 'Hello'
  const typeLabel = itemType === 'course' ? 'course' : 'unit'
  const expiryLine = expiresAt
    ? `<p style="color:#4A5043;font-size:14px;margin:8px 0 0;">
        📅 <strong>Access expires on:</strong>
        ${expiresAt.toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
       </p>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f7f7ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(39,24,126,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#27187e,#3a86ff);padding:32px 40px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;">Zanrosh Academy</h1>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Physics, Visualized.</p>
            </td>
          </tr>

          <!-- Success Badge -->
          <tr>
            <td style="padding:36px 40px 0;text-align:center;">
              <div style="display:inline-block;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;">✅</div>
              <h2 style="color:#27187e;font-size:22px;font-weight:900;margin:16px 0 4px;">Payment Confirmed!</h2>
              <p style="color:#4A5043;font-size:15px;margin:0;">${greeting}, your ${typeLabel} has been unlocked.</p>
            </td>
          </tr>

          <!-- Details Box -->
          <tr>
            <td style="padding:28px 40px;">
              <div style="background:#f7f7ff;border:1px solid rgba(39,24,126,0.1);border-radius:16px;padding:24px;">
                <p style="color:#27187e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">📚 What You Unlocked</p>
                <p style="color:#27187e;font-size:20px;font-weight:900;margin:0 0 16px;">${itemTitle}</p>
                <hr style="border:none;border-top:1px solid rgba(39,24,126,0.08);margin:16px 0;" />
                <p style="color:#4A5043;font-size:14px;margin:0 0 8px;">💳 <strong>Amount Paid:</strong> Rs ${price.toLocaleString()}</p>
                ${expiryLine}
                <p style="color:#4A5043;font-size:14px;margin:8px 0 0;">🎯 <strong>Status:</strong> <span style="color:#059669;font-weight:700;">Active &amp; Ready to Watch</span></p>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 36px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zanroshacademy.com'}/dashboard"
                 style="display:inline-block;background:linear-gradient(135deg,#27187e,#3a86ff);color:#fff;text-decoration:none;font-weight:900;font-size:16px;padding:16px 44px;border-radius:50px;box-shadow:0 4px 16px rgba(39,24,126,0.3);">
                Go to Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7f7ff;padding:20px 40px;text-align:center;border-top:1px solid rgba(39,24,126,0.06);">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Zanrosh Academy · Green Town Sariab Road, Quetta<br/>
                Questions? Email us at <a href="mailto:info@zanroshacademy.com" style="color:#3a86ff;">info@zanroshacademy.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: `✅ ${itemTitle} Unlocked — Zanrosh Academy`,
      html,
    })

    if (error) {
      console.error('[Mailer] Resend error:', error)
    } else {
      console.log(`[Mailer] Confirmation email sent to ${to}`)
    }
  } catch (err) {
    console.error('[Mailer] Failed to send email:', err)
  }
}

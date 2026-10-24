import { Resend } from 'resend'

const DIRECT_RESEND_KEY = Buffer.from('cmVfNWd4ZVBCS3JfUDFSU0JvVFEyV3FEbmViektHMUVYN0pr', 'base64').toString('utf-8')

// Resend client helper — safely initialized so it never crashes Next.js build
function getResend() {
  const key = DIRECT_RESEND_KEY || process.env.RESEND_API_KEY
  if (!key) return null
  try {
    return new Resend(key)
  } catch {
    return null
  }
}

// "From" address — while in Resend free/testing mode this works fine.
// Once you verify your domain in Resend dashboard you can change to:
//   "Zanrosh Academy <info@zanroshacademy.com>"
const FROM = 'Zanrosh Academy <onboarding@resend.dev>'

// Official academy email to receive all payment and request alerts
export const ADMIN_EMAIL = 'zanroshacademy@gmail.com'

export interface CourseUnlockedEmailData {
  to: string              // student's email (dynamic — each student gets their own)
  userName?: string       // optional first name
  itemTitle: string       // topic/unit/course title
  price: number           // amount paid in PKR
  itemType: 'course' | 'chapter' | 'topic'
  expiresAt?: Date | null // for units/topics: expiry date
}

/**
 * Send a "Your course has been unlocked" confirmation email to the student
 * AND send a payment received notification to zanroshacademy@gmail.com.
 * Silently swallows errors so payment flow is never blocked.
 */
export async function sendCourseUnlockedEmail(data: CourseUnlockedEmailData) {
  const { to, userName, itemTitle, price, itemType, expiresAt } = data

  const resend = getResend()
  if (!resend) {
    console.warn('[Mailer] Resend client not configured — skipping email')
    return
  }

  const greeting = userName ? `Hi ${userName}` : 'Hello'
  const typeLabel = itemType === 'course' ? 'course' : itemType === 'topic' ? 'topic' : 'unit'
  const expiryLine = expiresAt
    ? `<p style="color:#4A5043;font-size:14px;margin:8px 0 0;">
        📅 <strong>Access expires on:</strong>
        ${expiresAt.toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
       </p>`
    : ''

  const studentHtml = `
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
              <div style="display:inline-block;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;">🎉</div>
              <h2 style="color:#27187e;font-size:22px;font-weight:900;margin:16px 0 4px;">You Got The Course Unlocked!</h2>
              <p style="color:#4A5043;font-size:15px;margin:0;">${greeting}, your ${typeLabel} <strong>${itemTitle}</strong> is approved! It's unlocked for you now.</p>
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

  // 1. Send confirmation to student
  if (to && to.includes('@')) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: [to],
        subject: `🎉 You got ${itemTitle} Unlocked! — Zanrosh Academy`,
        html: studentHtml,
      })

      if (error) {
        console.error('[Mailer] Student email error:', error)
        // If Resend test account restricts sending to unverified domains:
        // Forward the student confirmation email to ADMIN_EMAIL so the notification is never lost!
        if (to !== ADMIN_EMAIL) {
          await resend.emails.send({
            from: FROM,
            to: [ADMIN_EMAIL],
            subject: `[Student Copy] ✅ ${itemTitle} Unlocked for ${to}`,
            html: studentHtml,
          }).catch(err => console.error('[Mailer] Forward error:', err))
        }
      } else {
        console.log(`[Mailer] Confirmation email sent to student ${to} (id: ${data?.id})`)
      }
    } catch (err) {
      console.error('[Mailer] Failed to send student email:', err)
      if (to !== ADMIN_EMAIL) {
        await resend.emails.send({
          from: FROM,
          to: [ADMIN_EMAIL],
          subject: `[Student Copy] ✅ ${itemTitle} Unlocked for ${to}`,
          html: studentHtml,
        }).catch(() => {})
      }
    }
  }

  // 2. ALWAYS send payment confirmed notification to zanroshacademy@gmail.com
  try {
    const adminHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f7f7ff;padding:25px;margin:0;">
  <div style="max-width:550px;margin:0 auto;background:#fff;border-radius:16px;padding:30px;border:1px solid #e2e8f0;box-shadow:0 2px 12px rgba(0,0,0,0.05);">
    <div style="background:#ecfdf5;color:#065f46;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block;margin-bottom:15px;">
      ✅ Payment Paid &amp; Unlocked
    </div>
    <h2 style="color:#27187e;margin:0 0 10px;">💰 New Payment Confirmed!</h2>
    <p style="color:#475569;font-size:14px;margin-bottom:20px;">A student completed payment and their access has been granted:</p>
    
    <div style="background:#f8fafc;padding:18px;border-radius:12px;border:1px solid #e2e8f0;">
      <p style="margin:6px 0;font-size:14px;"><strong>Student:</strong> ${userName || 'N/A'}</p>
      <p style="margin:6px 0;font-size:14px;"><strong>Email:</strong> ${to || 'N/A'}</p>
      <p style="margin:6px 0;font-size:14px;"><strong>Item:</strong> ${itemTitle} (${typeLabel})</p>
      <p style="margin:6px 0;font-size:14px;"><strong>Amount Paid:</strong> <span style="color:#059669;font-weight:bold;font-size:16px;">Rs ${price.toLocaleString()}</span></p>
      ${expiryLine}
      <p style="margin:6px 0;font-size:13px;color:#64748b;"><strong>Time:</strong> ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
    </div>

    <div style="margin-top:24px;text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://zanroshacademy.com'}/admin/payments" 
         style="display:inline-block;background:#27187e;color:#fff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:8px;font-size:14px;">
        Open Admin Payments Panel →
      </a>
    </div>
  </div>
</body>
</html>
`
    const { error: adminError } = await resend.emails.send({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject: `💰 [Paid] Rs ${price.toLocaleString()} for ${itemTitle} (${userName || to})`,
      html: adminHtml,
    })

    if (adminError) {
      console.error('[Mailer] Admin payment notification error:', adminError)
    } else {
      console.log(`[Mailer] Payment notification sent to ${ADMIN_EMAIL}`)
    }
  } catch (err) {
    console.error('[Mailer] Failed to send admin payment email:', err)
  }
}

export interface PaymentRequestEmailData {
  userName?: string
  userEmail?: string
  itemTitle: string
  price: number
  itemType: 'course' | 'chapter' | 'topic'
  method: string
  transactionId?: string
  screenshotUrl?: string
}

/**
 * Send an alert to zanroshacademy@gmail.com whenever a payment is requested (screenshot uploaded / manual transfer),
 * and an acknowledgment to the student.
 */
export async function sendPaymentRequestEmail(data: PaymentRequestEmailData) {
  const { userName, userEmail, itemTitle, price, itemType, method, transactionId, screenshotUrl } = data

  const resend = getResend()
  if (!resend) {
    console.warn('[Mailer] Resend client not configured — skipping email')
    return
  }

  const typeLabel = itemType === 'course' ? 'course' : itemType === 'topic' ? 'topic' : 'unit'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zanroshacademy.com'

  // 1. Send alert to zanroshacademy@gmail.com
  try {
    const adminHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f7f7ff;padding:25px;margin:0;">
  <div style="max-width:550px;margin:0 auto;background:#fff;border-radius:16px;padding:30px;border:1px solid #e2e8f0;box-shadow:0 2px 12px rgba(0,0,0,0.05);">
    <div style="background:#fef3c7;color:#92400e;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block;margin-bottom:15px;">
      🔔 Action Required: New Payment Request
    </div>
    <h2 style="color:#27187e;margin:0 0 10px;">Payment Request Submitted</h2>
    <p style="color:#475569;font-size:14px;margin-bottom:20px;">A student submitted a payment request that requires review:</p>
    
    <div style="background:#f8fafc;padding:18px;border-radius:12px;border:1px solid #e2e8f0;">
      <p style="margin:6px 0;font-size:14px;"><strong>Student Name:</strong> ${userName || 'N/A'}</p>
      <p style="margin:6px 0;font-size:14px;"><strong>Student Email:</strong> ${userEmail || 'N/A'}</p>
      <p style="margin:6px 0;font-size:14px;"><strong>Item Requested:</strong> ${itemTitle} (${typeLabel})</p>
      <p style="margin:6px 0;font-size:14px;"><strong>Amount:</strong> <span style="color:#b45309;font-weight:bold;font-size:16px;">Rs ${price.toLocaleString()}</span></p>
      <p style="margin:6px 0;font-size:14px;"><strong>Payment Method:</strong> ${method}</p>
      <p style="margin:6px 0;font-size:14px;"><strong>Transaction ID:</strong> ${transactionId || 'None provided'}</p>
      <p style="margin:6px 0;font-size:13px;color:#64748b;"><strong>Submitted Time:</strong> ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
    </div>

    ${screenshotUrl ? `
    <div style="margin:20px 0;text-align:center;">
      <p style="margin-bottom:8px;font-weight:bold;color:#475569;font-size:14px;">Payment Screenshot:</p>
      <a href="${screenshotUrl}" target="_blank" style="display:inline-block;">
        <img src="${screenshotUrl}" alt="Payment Screenshot" style="max-width:100%;max-height:300px;border-radius:10px;border:1px solid #cbd5e1;" />
      </a>
      <p style="margin-top:6px;"><a href="${screenshotUrl}" target="_blank" style="color:#2563eb;font-size:13px;font-weight:bold;">View Full Resolution Screenshot ↗</a></p>
    </div>` : ''}

    <div style="margin-top:24px;text-align:center;">
      <a href="${appUrl}/admin/payments" 
         style="display:inline-block;background:#27187e;color:#fff;text-decoration:none;font-weight:bold;padding:14px 32px;border-radius:8px;font-size:15px;box-shadow:0 4px 12px rgba(39,24,126,0.25);">
        Accept &amp; Review Payment in Admin Panel →
      </a>
    </div>
  </div>
</body>
</html>
`
    const { error: adminError } = await resend.emails.send({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject: `🔔 [Accept Payment] New payment request of Rs ${price.toLocaleString()} for ${itemTitle} from ${userName || userEmail || 'Student'}`,
      html: adminHtml,
    })

    if (adminError) {
      console.error('[Mailer] Payment request admin notification error:', adminError)
    } else {
      console.log(`[Mailer] Payment request alert sent to ${ADMIN_EMAIL}`)
    }
  } catch (err) {
    console.error('[Mailer] Failed to send payment request email to admin:', err)
  }

  // 2. Also send acknowledgment to student if email is available
  if (userEmail && userEmail.includes('@') && userEmail !== ADMIN_EMAIL) {
    try {
      const studentHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f7f7ff;padding:25px;margin:0;">
  <div style="max-width:550px;margin:0 auto;background:#fff;border-radius:16px;padding:30px;border:1px solid #e2e8f0;text-align:center;">
    <div style="display:inline-block;background:#fef3c7;border:2px solid #fde68a;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:30px;">⏳</div>
    <h2 style="color:#27187e;margin:15px 0 6px;">Payment Request Received</h2>
    <p style="color:#475569;font-size:15px;margin:0 0 20px;">Hi ${userName || 'there'}, we have received your payment submission for <strong>${itemTitle}</strong>.</p>
    
    <div style="background:#f8fafc;padding:16px;border-radius:12px;margin:20px 0;text-align:left;border:1px solid #e2e8f0;">
      <p style="margin:6px 0;font-size:14px;"><strong>Amount:</strong> Rs ${price.toLocaleString()}</p>
      <p style="margin:6px 0;font-size:14px;"><strong>Method:</strong> ${method}</p>
      ${transactionId ? `<p style="margin:6px 0;font-size:14px;"><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
      <p style="margin:6px 0;font-size:14px;"><strong>Status:</strong> <span style="color:#b45309;font-weight:bold;">Under Verification</span></p>
    </div>

    <p style="color:#64748b;font-size:13px;line-height:1.5;">Our academy team is reviewing your transaction. Once approved, your unit/course will be immediately unlocked and you will receive a confirmation email!</p>
    
    <div style="margin-top:24px;">
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#27187e;color:#fff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:8px;font-size:14px;">
        Go to Dashboard →
      </a>
    </div>
  </div>
</body>
</html>
`
      const { error: studentError } = await resend.emails.send({
        from: FROM,
        to: [userEmail],
        subject: `⏳ Payment Request Received: ${itemTitle} — Zanrosh Academy`,
        html: studentHtml,
      })

      if (studentError) {
        console.error('[Mailer] Student request acknowledgment error:', studentError)
      } else {
        console.log(`[Mailer] Request acknowledgment sent to ${userEmail}`)
      }
    } catch (err) {
      console.error('[Mailer] Failed to send student request confirmation:', err)
    }
  }
}

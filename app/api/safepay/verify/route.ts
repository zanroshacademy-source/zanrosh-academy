import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { NextResponse } from 'next/server'

const getAppUrl = () => {
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl
}

// ── Shared verification logic ──────────────────────────────────────────────────
async function handleVerification(
  tracker: string | null,
  reference: string | null,
  orderId: string | null
): Promise<NextResponse> {
  const appUrl = getAppUrl()

  if (!tracker) {
    console.error('[Safepay] Missing tracker in callback')
    return NextResponse.redirect(new URL('/dashboard?error=missing_safepay_data', appUrl), 303)
  }

  await connectDB()

  let payment: any = null
  if (orderId) {
    payment = await Payment.findById(orderId)
  }
  if (!payment) {
    payment = await Payment.findOne({ safepayTrackerId: tracker })
  }

  if (!payment) {
    return NextResponse.redirect(new URL('/dashboard?error=payment_not_found', appUrl), 303)
  }

  // Already approved — just redirect
  if (payment.status === 'approved') {
    const redirectId = payment.courseId || payment.chapterId
    return NextResponse.redirect(new URL(`/courses/${redirectId}`, appUrl), 303)
  }

  payment.status = 'approved'
  payment.transactionId = reference || tracker
  await payment.save()

  const existingPurchase = await Purchase.findOne({ paymentId: payment._id })
  if (existingPurchase) {
    existingPurchase.status = 'approved'
    await existingPurchase.save()
  } else {
    await Purchase.create({
      userId: payment.userId,
      paymentId: payment._id,
      status: 'approved',
      courseId: payment.courseId,
      chapterId: payment.chapterId,
    })
  }

  const redirectId = payment.courseId || payment.chapterId
  return NextResponse.redirect(new URL(`/courses/${redirectId}`, appUrl), 303)
}

// ── GET: Safepay hosted checkout redirects back here with query params ────────
// e.g. /api/safepay/verify?tracker=...&reference=...&order_id=...
export async function GET(request: Request) {
  const appUrl = getAppUrl()
  try {
    const { searchParams } = new URL(request.url)
    const tracker = searchParams.get('tracker')
    const reference = searchParams.get('reference')
    const orderId = searchParams.get('order_id')

    console.log('[Safepay] GET verify. Tracker:', tracker, 'OrderId:', orderId)

    return handleVerification(tracker, reference, orderId)
  } catch (err: any) {
    console.error('[Safepay] GET verification error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=server_error', appUrl), 303)
  }
}

// ── POST: Fallback for webhook-style callbacks ────────────────────────────────
export async function POST(request: Request) {
  const appUrl = getAppUrl()
  try {
    const contentType = request.headers.get('content-type') || ''
    let tracker: string | null = null
    let reference: string | null = null
    let orderId: string | null = null

    if (contentType.includes('application/json')) {
      const body = await request.json()
      tracker = body.tracker || body.token || null
      reference = body.reference || null
      orderId = body.order_id || null
    } else {
      const formData = await request.formData()
      tracker = formData.get('tracker') as string | null
      reference = (formData.get('reference') || formData.get('sig')) as string | null
      orderId = formData.get('order_id') as string | null
    }

    console.log('[Safepay] POST verify. Tracker:', tracker, 'OrderId:', orderId)

    return handleVerification(tracker, reference, orderId)
  } catch (err: any) {
    console.error('[Safepay] POST verification error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=server_error', appUrl), 303)
  }
}

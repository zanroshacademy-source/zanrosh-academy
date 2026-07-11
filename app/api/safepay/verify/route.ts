import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  const getAppUrl = () => {
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl
  }
  const appUrl = getAppUrl()

  try {
    const secretKey = (process.env.SAFEPAY_SECRET_KEY || process.env.NEXT_PUBLIC_SAFEPAY_SECRET_KEY) as string

    // Clone request so we can read formData and still have headers
    const formData = await request.formData()
    const tracker = formData.get('tracker') as string
    const signature = (formData.get('sig') || formData.get('signature')) as string
    const reference = formData.get('reference') as string
    const orderId = formData.get('order_id') as string

    console.log('[Safepay] POST received. Tracker:', tracker, 'OrderId:', orderId)

    if (!tracker || !signature) {
      console.error('[Safepay] Missing tracker or signature in POST body')
      return NextResponse.redirect(new URL('/dashboard?error=missing_safepay_data', appUrl), 303)
    }

    // HMAC-SHA256 verification — identical to what SDK does internally
    const computed = crypto.createHmac('sha256', secretKey).update(tracker).digest('hex')
    if (computed !== signature) {
      console.error('[Safepay] Signature FAILED. Expected:', computed, 'Got:', signature)
      return NextResponse.redirect(new URL('/dashboard?error=invalid_safepay_signature', appUrl), 303)
    }

    console.log('[Safepay] Signature valid.')

    await connectDB()

    let payment
    if (orderId) {
      payment = await Payment.findById(orderId)
    }
    if (!payment) {
      payment = await Payment.findOne({ safepayTrackerId: tracker })
    }

    if (!payment) return NextResponse.redirect(new URL('/dashboard?error=payment_not_found', appUrl), 303)

    if (payment.status === 'approved') {
      const redirectId = payment.courseId || payment.chapterId
      return NextResponse.redirect(new URL(`/courses/${redirectId}`, appUrl), 303)
    }

    payment.status = 'approved'
    payment.transactionId = reference || tracker
    await payment.save()

    const purchase = await Purchase.findOne({ paymentId: payment._id })
    if (purchase) {
      purchase.status = 'approved'
      await purchase.save()
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
  } catch (err: any) {
    console.error('[Safepay] Verification error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=server_error', appUrl), 303)
  }
}


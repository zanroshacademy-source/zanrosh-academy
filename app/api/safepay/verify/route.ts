import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

export async function POST(request: Request) {
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
      return redirect('/dashboard?error=missing_safepay_data')
    }

    // HMAC-SHA256 verification — identical to what SDK does internally
    const computed = crypto.createHmac('sha256', secretKey).update(tracker).digest('hex')
    if (computed !== signature) {
      console.error('[Safepay] Signature FAILED. Expected:', computed, 'Got:', signature)
      return redirect('/dashboard?error=invalid_safepay_signature')
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

    if (!payment) return redirect('/dashboard?error=payment_not_found')

    if (payment.status === 'approved') {
      const redirectId = payment.courseId || payment.chapterId
      return redirect(`/courses/${redirectId}`)
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
    return redirect(`/courses/${redirectId}`)
  } catch (err: any) {
    console.error('[Safepay] Verification error:', err)
    return redirect('/dashboard?error=server_error')
  }
}


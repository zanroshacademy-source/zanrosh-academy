import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const tracker = formData.get('tracker') as string
    const signature = formData.get('sig') as string || formData.get('signature') as string
    const reference = formData.get('reference') as string
    const orderId = formData.get('order_id') as string

    if (!tracker || !signature) {
      console.error('Missing Safepay POST data:', { tracker, signature, reference, orderId })
      return redirect('/dashboard?error=missing_safepay_data')
    }

    const secretKey = (process.env.SAFEPAY_SECRET_KEY || process.env.NEXT_PUBLIC_SAFEPAY_SECRET_KEY) as string

    // Validate Signature HMAC
    const computedSignature = crypto.createHmac('sha256', secretKey).update(tracker).digest('hex')
    if (computedSignature !== signature) {
      console.error('Safepay signature validation failed:', { computedSignature, signature })
      return redirect('/dashboard?error=invalid_safepay_signature')
    }

    await connectDB()

    // Find the payment by ID or tracker
    let payment
    if (orderId) {
      payment = await Payment.findById(orderId)
    } else {
      payment = await Payment.findOne({ safepayTrackerId: tracker })
    }

    if (!payment) return redirect('/dashboard?error=payment_not_found')

    // Process payment
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
    console.error('Safepay verification error:', err)
    return redirect('/dashboard?error=server_error')
  }
}

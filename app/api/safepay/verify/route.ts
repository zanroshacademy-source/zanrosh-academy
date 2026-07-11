import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  try {
    const isSandbox = process.env.NEXT_PUBLIC_SAFEPAY_ENVIRONMENT === 'sandbox'
    const apiKey = (process.env.SAFEPAY_API_KEY || process.env.NEXT_PUBLIC_SAFEPAY_API_KEY) as string
    const secretKey = (process.env.SAFEPAY_SECRET_KEY || process.env.NEXT_PUBLIC_SAFEPAY_SECRET_KEY) as string

    const { Safepay } = await import('@sfpy/node-sdk')
    const safepay = new Safepay({
      environment: isSandbox ? 'sandbox' : 'production',
      apiKey,
      v1Secret: secretKey,
      webhookSecret: secretKey,
    })

    // SDK reads tracker + sig from the request and validates HMAC
    const valid = safepay.verify.signature(request)

    if (!valid) {
      console.error('[Safepay] Signature validation FAILED')
      return redirect('/dashboard?error=invalid_safepay_signature')
    }

    const formData = await request.formData()
    const tracker = formData.get('tracker') as string
    const reference = formData.get('reference') as string
    const orderId = formData.get('order_id') as string

    console.log('[Safepay] Signature valid. Tracker:', tracker, 'OrderId:', orderId)

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


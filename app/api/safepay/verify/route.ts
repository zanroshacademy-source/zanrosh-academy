import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { redirect } from 'next/navigation'
import safepayCore from '@sfpy/node-core'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tracker = url.searchParams.get('tracker') || ''
  
  if (!tracker) {
    return redirect('/dashboard?error=missing_safepay_tracker')
  }

  const isSandbox = process.env.NEXT_PUBLIC_SAFEPAY_ENVIRONMENT === 'sandbox'
  const secretKey = process.env.SAFEPAY_SECRET_KEY as string

  try {
    const safepay = new (safepayCore as any)(secretKey, {
      authType: 'secret',
      host: isSandbox ? 'https://sandbox.api.getsafepay.com' : 'https://api.getsafepay.com'
    })

    // 1. Fetch tracker status directly from Safepay (safest verification)
    const response = await safepay.reporter.payments.fetch(tracker)
    
    if (response.data.tracker.state !== 'TRACKER_ENDED') {
      console.error('Safepay tracker state is not ended', response.data.tracker.state)
      return redirect('/dashboard?error=payment_not_completed')
    }

    await connectDB()

    // 2. Find the payment by the tracker ID
    const payment = await Payment.findOne({ safepayTrackerId: tracker })
    if (!payment) return redirect('/dashboard?error=payment_not_found')

    // 3. Process payment
    if (payment.status === 'approved') {
      const redirectId = payment.courseId || payment.chapterId
      return redirect(`/courses/${redirectId}`)
    }

    payment.status = 'approved'
    payment.transactionId = response.data.action?.token || tracker
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

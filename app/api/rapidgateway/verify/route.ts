import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import Chapter from '@/models/Chapter'
import { NextResponse } from 'next/server'

const getAppUrl = () => {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

async function getCourseRedirectId(payment: any): Promise<string | null> {
  if (payment.courseId) return payment.courseId.toString()
  if (payment.chapterId) {
    const chapter = await Chapter.findById(payment.chapterId).select('courseId').lean()
    if (chapter?.courseId) return chapter.courseId.toString()
  }
  return null
}

export async function GET(request: Request) {
  const appUrl = getAppUrl()
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')   // success | failed | complete
    const basketId = searchParams.get('basket')

    console.log('[RapidGateway] Verify. Status:', status, 'Basket:', basketId)

    if (!basketId) {
      return NextResponse.redirect(new URL('/dashboard?error=missing_basket_id', appUrl), 303)
    }

    await connectDB()

    const payment = await Payment.findOne({ rapidGatewayBasketId: basketId })
    if (!payment) {
      return NextResponse.redirect(new URL('/dashboard?error=payment_not_found', appUrl), 303)
    }

    if (status === 'success') {
      // ── Payment succeeded ────────────────────────────────────────────────
      payment.status = 'approved'
      payment.transactionId = basketId
      await payment.save()

      // Calculate expiresAt from unit accessDays
      let expiresAt: Date | null = null
      if (payment.chapterId) {
        const chapter = await Chapter.findById(payment.chapterId).select('accessDays').lean()
        const days = (chapter as any)?.accessDays ?? 15
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      }

      const existingPurchase = await Purchase.findOne({ paymentId: payment._id })
      if (existingPurchase) {
        existingPurchase.status = 'approved'
        if (expiresAt) existingPurchase.expiresAt = expiresAt
        await existingPurchase.save()
      } else {
        const pd: any = {
          userId: payment.userId,
          paymentId: payment._id,
          status: 'approved',
          courseId: payment.courseId,
          chapterId: payment.chapterId,
        }
        if (expiresAt) pd.expiresAt = expiresAt
        await Purchase.create(pd)
      }

      const courseId = await getCourseRedirectId(payment)
      if (courseId) return NextResponse.redirect(new URL(`/courses/${courseId}`, appUrl), 303)
      return NextResponse.redirect(new URL('/dashboard', appUrl), 303)

    } else if (status === 'failed') {
      // ── Payment failed ───────────────────────────────────────────────────
      payment.status = 'rejected'
      await payment.save()

      await Purchase.findOneAndUpdate(
        { paymentId: payment._id },
        { status: 'rejected' }
      )

      const courseId = await getCourseRedirectId(payment)
      const redirectBase = courseId ? `/buy/${payment.chapterId || payment.courseId}` : '/dashboard'
      return NextResponse.redirect(new URL(`${redirectBase}?error=payment_failed`, appUrl), 303)

    } else {
      // complete or unknown — just redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', appUrl), 303)
    }
  } catch (err: any) {
    console.error('[RapidGateway] Verify error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=server_error', appUrl), 303)
  }
}

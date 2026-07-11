import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Payment from '@/models/Payment'
import { apiError } from '@/lib/utils'
import { z } from 'zod'

const InitSessionSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(['course', 'chapter']),
})

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const body = await request.json()
    const parsed = InitSessionSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { itemId, itemType } = parsed.data

    await connectDB()

    let price = 0
    if (itemType === 'course') {
      const course = await Course.findById(itemId)
      if (!course) return apiError('Course not found', 404)
      if (!course.isPublished) return apiError('Course is not available', 403)
      price = course.price
    } else {
      const chapter = await Chapter.findById(itemId)
      if (!chapter) return apiError('Chapter not found', 404)
      if (!chapter.isPublished) return apiError('Chapter is not available', 403)
      price = chapter.price
    }

    if (price <= 0) return apiError('Invalid price', 400)

    const isSandbox = process.env.NEXT_PUBLIC_SAFEPAY_ENVIRONMENT === 'sandbox'
    const secretKey = (process.env.SAFEPAY_SECRET_KEY || process.env.NEXT_PUBLIC_SAFEPAY_SECRET_KEY) as string
    const apiKey = (process.env.SAFEPAY_API_KEY || process.env.NEXT_PUBLIC_SAFEPAY_API_KEY) as string
    const baseUrl = isSandbox
      ? 'https://sandbox.api.getsafepay.com'
      : 'https://api.getsafepay.com'

    // ── STEP 1: Initialize SDK & Create Payment Session ──────────────────────
    const { Safepay } = await import('@sfpy/node-sdk')
    const safepay = new Safepay({
      environment: isSandbox ? 'sandbox' : 'production',
      apiKey,
      v1Secret: secretKey,
      webhookSecret: secretKey,
    })

    console.log(`[Safepay SDK] Creating payment for amount ${price * 100} PKR (paisas)`)

    // SDK expects amount in lowest denomination (paisas/cents)
    const { token } = await safepay.payments.create({
      amount: price * 100,
      currency: 'PKR',
    })

    console.log(`[Safepay SDK] Payment created. Token: ${token}`)

    // ── STEP 2: Save pending payment to DB ──────────────────────────────────
    const paymentData: any = {
      userId,
      method: 'safepay',
      amount: price,
      transactionId: `sfpy_${Date.now()}`,
      screenshotUrl: 'safepay_checkout',
      status: 'pending',
      safepayTrackerId: token,
    }
    if (itemType === 'course') paymentData.courseId = itemId
    else paymentData.chapterId = itemId

    const payment = await Payment.create(paymentData)

    // ── STEP 3: Build Checkout URL ──────────────────────────────────────────
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const appUrl = rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl
    const redirectUrl = `${appUrl}/api/safepay/verify`
    const cancelUrl = `${appUrl}/buy/${itemId}?type=${itemType}`

    const checkoutUrl = safepay.checkout.create({
      token,
      orderId: payment._id.toString(),
      cancelUrl,
      redirectUrl,
      source: 'custom',
      webhooks: false,
    })

    console.log('Safepay checkout URL:', checkoutUrl)

    return Response.json({ checkoutUrl })
  } catch (err: any) {
    console.error('Safepay session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

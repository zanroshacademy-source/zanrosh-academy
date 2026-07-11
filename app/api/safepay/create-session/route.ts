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

    // ── STEP 1: Create Payment Session (V1 API) ──────────────────────────────────────
    const payload = {
      client: apiKey,
      amount: price, // V1 accepts normal amount, not cents (1000.00)
      currency: 'PKR',
      environment: isSandbox ? 'sandbox' : 'production',
    }
    
    console.log(`[Safepay] Attempting to create session at ${baseUrl}/order/v1/init`)
    console.log(`[Safepay] Payload (masked):`, { ...payload, client: apiKey ? '***' + apiKey.slice(-4) : 'MISSING' })

    const sessionRes = await fetch(`${baseUrl}/order/v1/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const sessionData = await sessionRes.json()
    console.log(`[Safepay] Session response status: ${sessionRes.status} ${sessionRes.statusText}`)
    console.log(`[Safepay] Session response body:`, JSON.stringify(sessionData))

    if (!sessionRes.ok || !sessionData?.data?.token) {
      console.error('[Safepay] CRITICAL Session error:', JSON.stringify(sessionData))
      const errorMsg = sessionData?.status?.errors?.[0] || sessionData?.status?.message || 'Failed to create Safepay session'
      return apiError(`Safepay Session Error: ${errorMsg}`, 500)
    }

    const trackerToken: string = sessionData.data.token

    // ── STEP 2: Save pending payment to DB ──────────────────────────────────
    const paymentData: any = {
      userId,
      method: 'safepay',
      amount: price,
      transactionId: `sfpy_${Date.now()}`,
      screenshotUrl: 'safepay_checkout',
      status: 'pending',
      safepayTrackerId: trackerToken,
    }
    if (itemType === 'course') paymentData.courseId = itemId
    else paymentData.chapterId = itemId

    const payment = await Payment.create(paymentData)

    // ── STEP 3: Build Checkout URL ──────────────────────────────────────────
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const appUrl = rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl
    const redirectUrl = `${appUrl}/api/safepay/verify`
    const cancelUrl = `${appUrl}/buy/${itemId}?type=${itemType}`

    const checkoutParams = new URLSearchParams({
      env: isSandbox ? 'sandbox' : 'production',
      beacon: trackerToken,
      source: 'custom',
      order_id: payment._id.toString(),
      redirect_url: redirectUrl,
      cancel_url: cancelUrl,
    })

    const checkoutUrl = `${baseUrl}/components?${checkoutParams.toString()}`
    console.log('Safepay checkout URL:', checkoutUrl)

    return Response.json({ checkoutUrl })
  } catch (err: any) {
    console.error('Safepay session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

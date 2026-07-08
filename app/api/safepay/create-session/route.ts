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

    // ── STEP 1: Create Payment Session ──────────────────────────────────────
    // POST /order/payments/v3/
    const payload = {
      merchant_api_key: apiKey,
      mode: 'payment',
      currency: 'PKR',
      amount: price * 100,
    }
    
    console.log(`[Safepay] Attempting to create session at ${baseUrl}/order/payments/v3/`)
    console.log(`[Safepay] Payload (masked):`, { ...payload, merchant_api_key: apiKey ? '***' + apiKey.slice(-4) : 'MISSING' })
    console.log(`[Safepay] Secret key length:`, secretKey?.length || 0)

    const sessionRes = await fetch(`${baseUrl}/order/payments/v3/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SFPY-MERCHANT-SECRET': secretKey,
      },
      body: JSON.stringify(payload),
    })

    const sessionData = await sessionRes.json()
    console.log(`[Safepay] Session response status: ${sessionRes.status} ${sessionRes.statusText}`)
    console.log(`[Safepay] Session response body:`, JSON.stringify(sessionData))

    if (!sessionRes.ok || !sessionData?.data?.tracker?.token) {
      console.error('[Safepay] CRITICAL Session error:', JSON.stringify(sessionData))
      const errorMsg = sessionData?.status?.errors?.[0] || sessionData?.message || 'Failed to create Safepay session'
      return apiError(`Safepay Session Error: ${errorMsg}`, 500)
    }

    const trackerToken: string = sessionData.data.tracker.token

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

    // ── STEP 3: Create Authentication Token (tbt) ───────────────────────────
    // POST /client/passport/v1/token
    const passportRes = await fetch(`${baseUrl}/client/passport/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SFPY-MERCHANT-SECRET': secretKey,
      },
    })

    const passportData = await passportRes.json()
    console.log(`[Safepay] Passport response status: ${passportRes.status} ${passportRes.statusText}`)
    console.log(`[Safepay] Passport response body:`, JSON.stringify(passportData))

    if (!passportRes.ok || !passportData?.data) {
      console.error('[Safepay] CRITICAL Passport error:', JSON.stringify(passportData))
      return apiError('Failed to create Safepay auth token (TBT)', 500)
    }

    const tbt: string = passportData.data

    // ── STEP 4: Build Checkout URL ──────────────────────────────────────────
    // Docs: https://safepay-docs.netlify.app/build-your-integration/express-checkout
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const appUrl = rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl
    const redirectUrl = `${appUrl}/api/safepay/verify`
    const cancelUrl = `${appUrl}/buy/${itemId}?type=${itemType}`

    const checkoutParams = new URLSearchParams({
      environment: isSandbox ? 'sandbox' : 'production',
      beacon: trackerToken,
      tbt,
      source: 'hosted',
      redirect_url: redirectUrl,
      cancel_url: cancelUrl,
      order_id: payment._id.toString(),
    })

    const checkoutUrl = `${baseUrl}/embedded/?${checkoutParams.toString()}`
    console.log('Safepay checkout URL:', checkoutUrl)

    return Response.json({ checkoutUrl })
  } catch (err: any) {
    console.error('Safepay session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { apiError } from '@/lib/utils'
import { z } from 'zod'

// ── RapidGateway Sandbox Credentials ────────────────────────────────────────
const RG_CLIENT_ID     = 'client'
const RG_CLIENT_SECRET = 'secret'
const RG_MERCHANT_ID   = 'client'          // sandbox uses the client ID as merchant ID
const RG_MERCHANT_NAME = 'Zanrosh Academy'
const RG_BASE_URL      = 'https://secure.rapid-gateway.com'
const RG_TOKEN_URL     = `${RG_BASE_URL}/oauth2/token`
const RG_TXN_URL       = `${RG_BASE_URL}/sandbox/process-transaction`
// ─────────────────────────────────────────────────────────────────────────────

const InitSessionSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(['course', 'chapter']),
  customerMobile: z.string().optional(),
})

const getAppUrl = () => {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const body = await request.json()
    const parsed = InitSessionSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { itemId, itemType, customerMobile } = parsed.data

    await connectDB()

    // ── Get price ────────────────────────────────────────────────────────────
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

    // ── STEP 1: Get Bearer token via OAuth2 ──────────────────────────────────
    const credentials = Buffer.from(`${RG_CLIENT_ID}:${RG_CLIENT_SECRET}`).toString('base64')

    const tokenRes = await fetch(RG_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('[RapidGateway] Token error:', err)
      return apiError('Failed to authenticate with payment gateway', 502)
    }

    const { access_token: token } = await tokenRes.json()
    console.log('[RapidGateway] Token acquired.')

    // ── STEP 2: Create Payment + Purchase records in DB ──────────────────────
    const basketId = `ZA-${Date.now()}`

    const paymentData: any = {
      userId,
      method: 'rapidgateway',
      amount: price,
      transactionId: basketId,
      screenshotUrl: 'rapidgateway_checkout',
      status: 'pending',
      rapidGatewayBasketId: basketId,
    }
    if (itemType === 'course') paymentData.courseId = itemId
    else paymentData.chapterId = itemId

    const payment = await Payment.create(paymentData)

    const purchaseData: any = {
      userId,
      paymentId: payment._id,
      status: 'pending',
    }
    if (itemType === 'course') purchaseData.courseId = itemId
    else purchaseData.chapterId = itemId
    await Purchase.create(purchaseData)

    // ── STEP 3: Submit transaction — capture the 302 redirect URL ────────────
    const appUrl = getAppUrl()
    const successUrl = `${appUrl}/api/rapidgateway/verify?status=success&basket=${basketId}`
    const failureUrl = `${appUrl}/api/rapidgateway/verify?status=failed&basket=${basketId}`
    const checkoutUrl = `${appUrl}/api/rapidgateway/verify?status=complete&basket=${basketId}`

    const txnParams = new URLSearchParams({
      MERCHANT_ID:            RG_MERCHANT_ID,
      MERCHANT_NAME:          RG_MERCHANT_NAME,
      TXNAMT:                 String(price),
      CURRENCY_CODE:          'PKR',
      CUSTOMER_MOBILE_NO:     customerMobile || '03001234567',
      CUSTOMER_EMAIL_ADDRESS: 'student@zanrosh.pk',
      BASKET_ID:              basketId,
      TXNDESC:                'Zanrosh Academy - Unit Purchase',
      ORDER_DATE:             new Date().toISOString().split('T')[0],
      SUCCESS_URL:            successUrl,
      FAILURE_URL:            failureUrl,
      CHECKOUT_URL:           checkoutUrl,
      VERSION:                'MY_VER_1.0',
      PROCCODE:               '0',
    })

    const txnRes = await fetch(RG_TXN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: txnParams,
      redirect: 'manual', // critical — do NOT follow the 302, capture Location header
    })

    const redirectUrl = txnRes.headers.get('location')
    if (!redirectUrl) {
      const body = await txnRes.text()
      console.error('[RapidGateway] No redirect URL. Status:', txnRes.status, 'Body:', body)
      return apiError('Gateway did not return a checkout URL', 502)
    }

    console.log('[RapidGateway] Checkout URL:', redirectUrl)
    return Response.json({ checkoutUrl: redirectUrl })

  } catch (err: any) {
    console.error('[RapidGateway] Session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

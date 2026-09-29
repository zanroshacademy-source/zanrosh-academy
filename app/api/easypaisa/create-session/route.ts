import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Payment from '@/models/Payment'
import { apiError } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'

// ─── Easypaisa REST API Config ───────────────────────────────────────────────
const EP_STORE_ID    = process.env.EASYPAISA_STORE_ID    || '1294821'
const EP_API_USER    = process.env.EASYPAISA_API_USERNAME || ''
const EP_API_PASS    = process.env.EASYPAISA_API_PASSWORD || ''
const EP_ACCOUNT_NUM = process.env.EASYPAISA_ACCOUNT_NUM  || '173397419' // EWP Account #
// Force Sandbox mode for now as requested by user
const EP_SANDBOX     = true

// Easypaisa REST API URLs
const EP_MA_URL = EP_SANDBOX
  ? 'https://easypaystg.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction'
  : 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction'

const InitSchema = z.object({
  itemId:          z.string().min(1),
  itemType:        z.enum(['course', 'chapter']),
  mobileAccountNo: z.string().regex(/^03\d{9}$/, 'Invalid mobile number. Must be 03XXXXXXXXX (11 digits)'),
  emailAddress:    z.string().email('Invalid email address'),
})

/** Base64-encode "username:password" for the Credentials header */
function getCredentialsHeader(): string {
  return Buffer.from(`${EP_API_USER}:${EP_API_PASS}`).toString('base64')
}

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const body   = await request.json()
    const parsed = InitSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { itemId, itemType, mobileAccountNo, emailAddress } = parsed.data

    if (!EP_API_USER || !EP_API_PASS) {
      return apiError('Easypaisa REST API credentials are not configured on this server.', 500)
    }

    await connectDB()

    // ── Get item price ─────────────────────────────────────────────────────────
    let price = 0
    if (itemType === 'course') {
      const course = await Course.findById(itemId)
      if (!course)           return apiError('Course not found', 404)
      if (!course.isPublished) return apiError('Course is not available', 403)
      price = course.price
    } else {
      const chapter = await Chapter.findById(itemId)
      if (!chapter)            return apiError('Chapter not found', 404)
      if (!chapter.isPublished) return apiError('Chapter is not available', 403)
      price = chapter.price
    }
    if (price <= 0) return apiError('Invalid price', 400)

    // ── Clean up old pending payments ─────────────────────────────────────────
    const oldQ: any = { userId, method: 'easypaisa', status: 'pending' }
    if (itemType === 'course') oldQ.courseId = itemId
    else oldQ.chapterId = itemId
    await Payment.deleteMany(oldQ)

    // ── Generate order ID ──────────────────────────────────────────────────────
    const orderId = `ZAN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    // ── Store pending Payment ──────────────────────────────────────────────────
    const paymentData: any = {
      userId,
      method:        'easypaisa',
      amount:        price,
      transactionId: orderId,
      screenshotUrl: 'easypaisa_pending',
      status:        'pending',
      easypaisaRef:  orderId,
    }
    if (itemType === 'course') paymentData.courseId = itemId
    else paymentData.chapterId = itemId
    await Payment.create(paymentData)

    // ── Call Easypaisa Initiate MA Transaction API ─────────────────────────────
    const requestBody = {
      orderId,
      storeId:         EP_STORE_ID,
      transactionAmount: price.toFixed(1),
      transactionType: 'MA',
      mobileAccountNo,
      emailAddress,
    }

    console.log('[Easypaisa MA] Initiating transaction:', requestBody)

    const epRes = await fetch(EP_MA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Credentials':  getCredentialsHeader(),
      },
      body: JSON.stringify(requestBody),
    })

    const epData = await epRes.json()
    console.log('[Easypaisa MA] Response:', epData)

    if (epData.responseCode !== '0000') {
      // Clean up the pending payment on failure
      await Payment.deleteOne({ easypaisaRef: orderId })

      const errorMessages: Record<string, string> = {
        '0001': 'System error on Easypaisa. Please try again.',
        '0002': 'Required field missing. Please check your details.',
        '0005': 'Merchant account not active. Contact support.',
        '0006': 'Invalid store ID.',
        '0007': 'Store not active.',
        '0008': 'Mobile Account payment is not enabled on this account.',
        '0010': 'Invalid API credentials.',
        '0013': 'Insufficient balance in your Easypaisa account.',
        '0014': 'Easypaisa account does not exist. Check your mobile number.',
      }
      const msg = errorMessages[epData.responseCode] || epData.responseDesc || 'Payment initiation failed.'
      return apiError(msg, 400)
    }

    // ── Transaction initiated — user will get USSD prompt on phone ─────────────
    // Save transactionId from Easypaisa for later verification
    await Payment.updateOne(
      { easypaisaRef: orderId },
      { $set: { transactionId: epData.transactionId || orderId } }
    )

    return Response.json({
      success:       true,
      orderId,
      transactionId: epData.transactionId,
      message:       'Payment request sent! Please approve the prompt on your phone.',
    })

  } catch (err: any) {
    console.error('[Easypaisa MA] create-session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

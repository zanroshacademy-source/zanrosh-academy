import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Topic from '@/models/Topic'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { apiError } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'
import { sendCourseUnlockedEmail } from '@/lib/mailer'

// ─── Easypaisa REST API Config ───────────────────────────────────────────────
const EP_STORE_ID    = process.env.EASYPAISA_STORE_ID     || '1294821'
const EP_API_USER    = process.env.EASYPAISA_API_USERNAME || 'ZANROSHACADEMY'
const EP_API_PASS    = process.env.EASYPAISA_API_PASSWORD || '95df2847c71b6bfbf871ed40c2c6e68c'
const EP_ACCOUNT_NUM = process.env.EASYPAISA_ACCOUNT_NUM  || '173397419' // EWP Account #
// Production mode
const EP_SANDBOX     = false

// Easypaisa REST API URLs
const EP_MA_URL = EP_SANDBOX
  ? 'https://easypaystg.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction'
  : 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction'

const InitSchema = z.object({
  itemId:          z.string().min(1),
  itemType:        z.enum(['course', 'chapter', 'topic']),
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

    // ── Get item price and title ───────────────────────────────────────────────
    let price = 0
    let itemTitle = 'Topic'
    let accessDays = 15

    if (itemType === 'topic') {
      const topic = await Topic.findById(itemId)
      if (!topic) return apiError('Topic not found', 404)
      if (!topic.isPublished) return apiError('Topic is not available', 403)
      const unit = await Chapter.findById(topic.unitId)
      price = (topic.price !== undefined && topic.price !== null && topic.price > 0) ? topic.price : (unit?.price || 0)
      itemTitle = topic.title || 'Topic'
      accessDays = topic.accessDays || unit?.accessDays || 15
    } else if (itemType === 'course') {
      const course = await Course.findById(itemId)
      if (!course)           return apiError('Course not found', 404)
      if (!course.isPublished) return apiError('Course is not available', 403)
      price = course.price
      itemTitle = course.title || 'Course'
    } else {
      const chapter = await Chapter.findById(itemId)
      if (!chapter)            return apiError('Chapter not found', 404)
      if (!chapter.isPublished) return apiError('Chapter is not available', 403)
      price = chapter.price
      itemTitle = chapter.title || 'Unit'
      accessDays = chapter.accessDays ?? 15
    }
    if (price <= 0) return apiError('Invalid price', 400)

    // ── Clean up old pending payments ─────────────────────────────────────────
    const oldQ: any = { userId, method: 'easypaisa', status: 'pending' }
    if (itemType === 'course') oldQ.courseId = itemId
    else if (itemType === 'chapter') oldQ.chapterId = itemId
    else oldQ.topicId = itemId
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
    else if (itemType === 'chapter') paymentData.chapterId = itemId
    else paymentData.topicId = itemId
    await Payment.create(paymentData)

    // ── Call Easypaisa Initiate MA Transaction API ─────────────────────────────
    const requestBody = {
      orderId,
      storeId:           EP_STORE_ID,
      transactionAmount: price,   // send as number, not string
      transactionType:   'MA',
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

    let epData;
    const rawText = await epRes.text();
    try {
      epData = JSON.parse(rawText);
      console.log('[Easypaisa MA] Response:', epData);
    } catch (e) {
      console.error('[Easypaisa MA] Invalid JSON response:', rawText.substring(0, 500));
      return apiError('Easypaisa service is currently unavailable or returned an invalid response. Please try again later.', 502);
    }

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

    // ── Transaction initiated & approved directly for Easypaisa Mobile Account ──
    const finalTxId = epData.transactionId || orderId

    await Payment.updateOne(
      { easypaisaRef: orderId },
      {
        $set: {
          transactionId: finalTxId,
          status: 'approved',
          screenshotUrl: 'easypaisa_direct',
        },
      }
    )

    // Calculate expiry based on accessDays
    let expiresAt: Date | null = null
    if (itemType === 'chapter' || itemType === 'topic') {
      expiresAt = new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000)
    }

    // Create approved Purchase immediately so student gets instant access
    const payment = await Payment.findOne({ easypaisaRef: orderId })
    if (payment) {
      const pd: any = { userId, paymentId: payment._id, status: 'approved' }
      if (itemType === 'course') pd.courseId = itemId
      else if (itemType === 'chapter') { pd.chapterId = itemId; if (expiresAt) pd.expiresAt = expiresAt }
      else { pd.topicId = itemId; if (expiresAt) pd.expiresAt = expiresAt }

      const existingPurchase = await Purchase.findOne({ paymentId: payment._id })
      if (!existingPurchase) {
        await Purchase.create(pd)
      } else {
        await Purchase.updateOne({ _id: existingPurchase._id }, { $set: { status: 'approved', expiresAt } })
      }
    }

    // ── Send confirmation emails in background so it never blocks or causes "failed to fetch"
    ;(async () => {
      try {
        let userName: string | undefined = undefined
        try {
          const { clerkClient } = await import('@clerk/nextjs/server')
          const client = await clerkClient()
          const clerkUser = await client.users.getUser(userId)
          userName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined
        } catch {}

        await sendCourseUnlockedEmail({
          to: emailAddress,
          userName,
          itemTitle,
          price,
          itemType: itemType === 'course' ? 'course' : 'chapter',
          expiresAt,
        })
      } catch (e) {
        console.error('[Easypaisa MA] Send course unlocked email error:', e)
      }
    })()

    return Response.json({
      success:       true,
      orderId,
      transactionId: finalTxId,
      status:        'PAID',
      message:       'Payment successful! Redirecting to your dashboard...',
    })

  } catch (err: any) {
    console.error('[Easypaisa MA] create-session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

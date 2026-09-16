import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { apiError } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'

// ─── Easypaisa Merchant Config ─────────────────────────────────────────────
const EP_STORE_ID = process.env.EASYPAISA_STORE_ID || ''
const EP_HASH_KEY = process.env.EASYPAISA_HASH_KEY || ''
const EP_INDEX_URL = 'https://easypay.easypaisa.com.pk/easypay/Index.jsf'

const InitSessionSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(['course', 'chapter']),
})

const getAppUrl = () => {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

/**
 * AES/ECB/PKCS5Padding encryption as required by Easypaisa.
 * The hash key from the merchant portal is used as the AES key.
 * Amount must be in 1 decimal point (e.g. "150.0").
 */
function generateHashedReq(params: Record<string, string>): string {
  if (!EP_HASH_KEY) return ''
  try {
    // Sort fields alphabetically by key
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
    const valueString = sorted.map(([k, v]) => `${k}=${v}`).join('&')

    // AES/ECB/PKCS5Padding (Node crypto uses PKCS7 which is identical for AES)
    const keyBuffer = Buffer.from(EP_HASH_KEY, 'utf8')
    const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer.slice(0, 16), null)
    cipher.setAutoPadding(true)
    const encrypted = Buffer.concat([cipher.update(valueString, 'utf8'), cipher.final()])
    return encrypted.toString('base64')
  } catch (err) {
    console.error('[Easypaisa] Hash generation failed:', err)
    return ''
  }
}

/** Format PKR amount as required: 1 decimal point */
function formatAmount(price: number): string {
  return price.toFixed(1)
}

/** Expiry date format: YYYYMMDD HHMMSS (1 day from now) */
function getExpiryDate(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const year  = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day   = pad(d.getDate())
  const hh    = pad(d.getHours())
  const mm    = pad(d.getMinutes())
  const ss    = pad(d.getSeconds())
  return `${year}${month}${day} ${hh}${mm}${ss}`
}

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

    // Generate unique order reference
    const orderRefNum = 'EP' + Date.now() + Math.floor(Math.random() * 1000)

    const appUrl = getAppUrl()
    // postBackURL1 = our callback handler (receives auth_token from Easypaisa)
    const postBackURL1 = `${appUrl}/api/easypaisa/callback?orderRef=${orderRefNum}`
    const expiryDate   = getExpiryDate()
    const amountStr    = formatAmount(price)

    // Create pending Payment & Purchase records
    const paymentData: any = {
      userId,
      method: 'easypaisa',
      amount: price,
      transactionId: orderRefNum,
      screenshotUrl: 'easypaisa_checkout',
      status: 'pending',
      easypaisaRef: orderRefNum,
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

    // Build params for Easypaisa
    const formParams: Record<string, string> = {
      storeId:      EP_STORE_ID,
      amount:       amountStr,
      postBackURL:  postBackURL1,
      orderRefNum:  orderRefNum,
      expiryDate:   expiryDate,
      autoRedirect: '1',
    }

    // Optionally include merchantHashedReq if hash key is configured
    if (EP_HASH_KEY) {
      formParams.merchantHashedReq = generateHashedReq(formParams)
    }

    console.log('[Easypaisa] create-session params:', JSON.stringify(formParams))

    return Response.json({
      endpoint: EP_INDEX_URL,
      params:   formParams,
    })
  } catch (err: any) {
    console.error('[Easypaisa] create-session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

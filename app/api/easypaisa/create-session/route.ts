import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Payment from '@/models/Payment'
import { apiError } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'

// ─── Easypaisa Merchant Config ──────────────────────────────────────────────
const EP_STORE_ID  = process.env.EASYPAISA_STORE_ID  || ''
const EP_HASH_KEY  = process.env.EASYPAISA_HASH_KEY  || ''
const EP_SANDBOX   = process.env.EASYPAISA_SANDBOX === 'true'

const EP_INDEX_URL = EP_SANDBOX
  ? 'https://easypaystg.easypaisa.com.pk/easypay/Index.jsf'
  : 'https://easypay.easypaisa.com.pk/easypay/Index.jsf'

const InitSessionSchema = z.object({
  itemId:   z.string().min(1),
  itemType: z.enum(['course', 'chapter']),
})

const getAppUrl = (req: Request) => {
  const u = new URL(req.url)
  return `${u.protocol}//${u.host}`
}

/**
 * Generates merchantHashedReq per Easypaisa official docs (section 5):
 *
 * 1. Create map of ALL the fields that are part of the request
 * 2. Sort alphabetically by key
 * 3. Join as key=val&key=val
 * 4. Encrypt with AES/ECB/PKCS5Padding, base64 output
 */
function generateHashedReq(params: Record<string, string>): string {
  if (!EP_HASH_KEY) return ''
  try {
    // Sort alphabetically (as per official docs)
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
    const valueString = sorted.map(([k, v]) => `${k}=${v}`).join('&')

    const keyBuffer = Buffer.from(EP_HASH_KEY, 'utf8')
    const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer.slice(0, 16), null)
    cipher.setAutoPadding(true)
    const encrypted = Buffer.concat([cipher.update(valueString, 'utf8'), cipher.final()])

    console.log('[Easypaisa] Hash input:', valueString)
    return encrypted.toString('base64')
  } catch (err) {
    console.error('[Easypaisa] Hash generation failed:', err)
    return ''
  }
}

function formatAmount(price: number): string {
  return price.toFixed(1)
}

function getExpiryDate(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
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
    if (!EP_STORE_ID) return apiError('Easypaisa is not configured on this server', 500)

    // Clean up old pending Easypaisa payments for this user+item to avoid junk
    const oldQuery: any = { userId, method: 'easypaisa', status: 'pending' }
    if (itemType === 'course') oldQuery.courseId = itemId
    else oldQuery.chapterId = itemId
    await Payment.deleteMany(oldQuery)

    // 12-digit numeric order reference
    const orderRefNum = Math.floor(100000 + Math.random() * 900000).toString()
                      + Math.floor(100000 + Math.random() * 900000).toString()

    const appUrl    = getAppUrl(request)
    const amountStr = formatAmount(price)
    const expiryDate = getExpiryDate()

    // ── Store session data in Payment (pending) so we can look it up in /verify ──
    // We use orderRefNum as the easypaisaRef key.
    // The verify route will update this to 'approved' on success.
    const paymentData: any = {
      userId,
      method:        'easypaisa',
      amount:        price,
      transactionId: orderRefNum,
      screenshotUrl: 'easypaisa_pending',
      status:        'pending',
      easypaisaRef:  orderRefNum,
    }
    if (itemType === 'course') paymentData.courseId = itemId
    else paymentData.chapterId = itemId
    await Payment.create(paymentData)

    // ── Callback URL: keep it clean (just orderRef) ─────────────────────────────
    // We look up session data from the Payment record in /verify.
    // Complex query params in postBackURL can cause Confirm.jsf to reject.
    // ─────────────────────────────────────────────────────────────────────────────
    const postBackURL1 = `${appUrl}/api/easypaisa/callback?orderRef=${orderRefNum}`

    // ── All form params sent to Easypaisa ─────────────────────────────────────
    // Removed optional fields (expiryDate, paymentMethod) to keep it as simple
    // as possible to prevent "request could not be processed" on their backend.
    const formParams: Record<string, string> = {
      storeId:       EP_STORE_ID,
      amount:        amountStr,
      postBackURL:   postBackURL1,
      orderRefNum:   orderRefNum,
      autoRedirect:  '0', // Changed to 0 just in case 1 causes issues
    }

    if (EP_HASH_KEY) {
      // Hash is calculated from ALL params sent in the request, sorted alphabetically
      formParams.merchantHashedReq = generateHashedReq(formParams)
    }

    console.log('[Easypaisa] create-session. sandbox:', EP_SANDBOX, 'storeId:', EP_STORE_ID, 'orderRef:', orderRefNum, 'amount:', amountStr)

    return Response.json({
      endpoint: EP_INDEX_URL,
      params:   formParams,
    })
  } catch (err: any) {
    console.error('[Easypaisa] create-session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

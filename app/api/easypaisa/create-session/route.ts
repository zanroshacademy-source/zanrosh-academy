import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Payment from '@/models/Payment'
import { apiError } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'

// ─── Easypaisa Merchant Config ──────────────────────────────────────────────
const EP_STORE_ID = process.env.EASYPAISA_STORE_ID || ''
const EP_HASH_KEY = process.env.EASYPAISA_HASH_KEY || ''
const EP_SANDBOX  = process.env.EASYPAISA_SANDBOX === 'true'

// Sandbox URLs (from official integration guide Section 7)
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

// ─── PKCS5 padding — matches the React Native reference exactly ─────────────
// pkcs5Pad pads `text` (string-level) to blockSize boundary using char codes.
// This is equivalent to PKCS7 but applied at string level before Buffer encoding.
function pkcs5Pad(text: string, blockSize: number): string {
  const pad = blockSize - (text.length % blockSize)
  return text + String.fromCharCode(pad).repeat(pad)
}

// ─── Sort object keys alphabetically, build key=val&key=val string ──────────
// Matches `convertObjectToString` from the React Native reference exactly.
function convertObjectToString(obj: Record<string, string>): string {
  let data = ''
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      data += `${key}=${obj[key]}&`
    })
  return data.slice(0, data.length - 1)
}

/**
 * Generates merchantHashedReq matching the React Native reference implementation:
 *
 *   const aes = new AesJs.ModeOfOperation.ecb(AesJs.utils.utf8.toBytes(HASH_KEY))
 *   const hasMapReq = Buffer.from(
 *     aes.encrypt(Buffer.from(pkcs5Pad(convertObjectToString(requestBody), 16)))
 *   ).toString('base64')
 *
 * Translated to Node.js crypto (AES-128-ECB, NO auto-padding, manual PKCS5):
 */
function generateHashedReq(params: Record<string, string>): string {
  if (!EP_HASH_KEY) return ''
  try {
    const valueString  = convertObjectToString(params)
    const padded       = pkcs5Pad(valueString, 16)

    // Key must be exactly 16 bytes for AES-128
    const keyBytes = Buffer.from(EP_HASH_KEY, 'utf8').slice(0, 16)

    // Disable Node's auto-padding — we already manually applied PKCS5
    const cipher = crypto.createCipheriv('aes-128-ecb', keyBytes, null)
    cipher.setAutoPadding(false)

    const inputBytes = Buffer.from(padded, 'utf8') // same as Buffer.from(pkcs5Pad(...)) in RN
    const encrypted  = Buffer.concat([cipher.update(inputBytes), cipher.final()])

    console.log('[Easypaisa] Hash input string:', valueString)
    console.log('[Easypaisa] Hash padded length:', padded.length, '(must be multiple of 16)')
    return encrypted.toString('base64')
  } catch (err) {
    console.error('[Easypaisa] Hash generation failed:', err)
    return ''
  }
}

function formatAmount(price: number): string {
  // Easypaisa requires 1 decimal place (e.g. "150.0")
  return price.toFixed(1)
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

    // Clean up old pending Easypaisa payments for this user+item
    const oldQuery: any = { userId, method: 'easypaisa', status: 'pending' }
    if (itemType === 'course') oldQuery.courseId = itemId
    else oldQuery.chapterId = itemId
    await Payment.deleteMany(oldQuery)

    // 12-digit numeric order reference
    const orderRefNum =
      Math.floor(100000 + Math.random() * 900000).toString() +
      Math.floor(100000 + Math.random() * 900000).toString()

    const appUrl    = getAppUrl(request)
    const amountStr = formatAmount(price)

    // Store session data in Payment (pending) so verify route can look it up by orderRefNum
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

    // Clean callback URL — Easypaisa will redirect here with auth_token
    const postBackURL = `${appUrl}/api/easypaisa/callback?orderRef=${orderRefNum}`

    // Build the request body (without merchantHashedReq) — matches RN example's requestBody
    const requestBody: Record<string, string> = {
      storeId:      EP_STORE_ID,
      amount:       amountStr,
      postBackURL:  postBackURL,
      orderRefNum:  orderRefNum,
      autoRedirect: '0',
    }

    // Compute hash over ALL fields in requestBody, then append it
    if (EP_HASH_KEY) {
      requestBody['merchantHashedReq'] = generateHashedReq(requestBody)
    }

    console.log('[Easypaisa] create-session — sandbox:', EP_SANDBOX, 'storeId:', EP_STORE_ID, 'orderRef:', orderRefNum, 'amount:', amountStr)
    console.log('[Easypaisa] endpoint:', EP_INDEX_URL)

    return Response.json({
      endpoint: EP_INDEX_URL,
      params:   requestBody,
    })
  } catch (err: any) {
    console.error('[Easypaisa] create-session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

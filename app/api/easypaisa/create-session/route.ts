import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import { apiError } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'

// ─── Easypaisa Merchant Config ──────────────────────────────────────────────
const EP_STORE_ID  = process.env.EASYPAISA_STORE_ID  || ''
const EP_HASH_KEY  = process.env.EASYPAISA_HASH_KEY  || ''
const EP_SANDBOX   = process.env.EASYPAISA_SANDBOX === 'true'

// Sandbox vs Production endpoints
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
 * AES/ECB/PKCS5Padding as required by Easypaisa.
 * Hash key must be exactly 16 characters for AES-128.
 */
function generateHashedReq(params: Record<string, string>): string {
  if (!EP_HASH_KEY) return ''
  try {
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
    const valueString = sorted.map(([k, v]) => `${k}=${v}`).join('&')
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

    const orderRefNum = 'EP' + Date.now() + Math.floor(Math.random() * 1000)
    const appUrl      = getAppUrl(request)

    // ── We do NOT create DB records here ──────────────────────────────────────
    // DB records are only created in /api/easypaisa/verify AFTER Easypaisa
    // confirms a successful payment. This prevents junk pending records when
    // Easypaisa rejects or user cancels.
    //
    // We carry session data (userId, itemId, itemType) through the URL chain:
    // postBackURL (callback) → verifyURL (verify)
    // ─────────────────────────────────────────────────────────────────────────

    const callbackParams = new URLSearchParams({
      orderRef: orderRefNum,
      userId,
      itemId,
      itemType,
      amount: price.toString(),
    }).toString()

    const postBackURL1 = `${appUrl}/api/easypaisa/callback?${callbackParams}`

    const formParams: Record<string, string> = {
      storeId:      EP_STORE_ID,
      amount:       formatAmount(price),
      postBackURL:  postBackURL1,
      orderRefNum:  orderRefNum,
      expiryDate:   getExpiryDate(),
      autoRedirect: '1',
      paymentMethod: 'MA_PAYMENT_METHOD',
    }

    if (EP_HASH_KEY) {
      formParams.merchantHashedReq = generateHashedReq(formParams)
    }

    console.log('[Easypaisa] create-session. sandbox:', EP_SANDBOX, 'storeId:', EP_STORE_ID, 'orderRef:', orderRefNum)

    return Response.json({
      endpoint: EP_INDEX_URL,
      params:   formParams,
    })
  } catch (err: any) {
    console.error('[Easypaisa] create-session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

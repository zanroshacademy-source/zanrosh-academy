import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Payment from '@/models/Payment'
import { apiError } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'

const EP_STORE_ID = process.env.EASYPAISA_STORE_ID || ''
const EP_SANDBOX  = process.env.EASYPAISA_SANDBOX === 'true'

// The REST API requires Username, Password, and an RSA Private Key.
// You must get these from Easypaisa Support.
const EP_API_USERNAME = process.env.EASYPAISA_API_USERNAME || ''
const EP_API_PASSWORD = process.env.EASYPAISA_API_PASSWORD || ''
const EP_RSA_PRIVATE_KEY = process.env.EASYPAISA_RSA_PRIVATE_KEY
  ? process.env.EASYPAISA_RSA_PRIVATE_KEY.replace(/\\n/g, '\n')
  : ''

const EP_QR_URL = EP_SANDBOX
  ? 'https://easypaystg.easypaisa.com.pk/easypay-service/rest/QRBusinessRestService/v1/generate-qr'
  : 'https://easypay.easypaisa.com.pk/easypay-service/rest/QRBusinessRestService/v1/generate-qr'

const InitSessionSchema = z.object({
  itemId:   z.string().min(1),
  itemType: z.enum(['course', 'chapter']),
})

function formatAmount(price: number): string {
  return price.toFixed(1)
}

/**
 * Generate RSA Signature using SHA256withRSA
 */
function generateRSASignature(jsonString: string): string {
  if (!EP_RSA_PRIVATE_KEY) return ''
  const signer = crypto.createSign('SHA256')
  signer.update(jsonString)
  signer.end()
  return signer.sign(EP_RSA_PRIVATE_KEY, 'base64')
}

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const body = await request.json()
    const parsed = InitSessionSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { itemId, itemType } = parsed.data

    if (!EP_API_USERNAME || !EP_API_PASSWORD || !EP_RSA_PRIVATE_KEY) {
      return apiError('Easypaisa REST API (RSA) is not fully configured on this server.', 500)
    }

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

    // 8-character alphanumeric order reference
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase()
    const orderRefNum = `ZAN-${randomStr}`

    // ── Store session data in Payment (pending) ──
    const paymentData: any = {
      userId,
      method:        'easypaisa_qr',
      amount:        price,
      transactionId: orderRefNum,
      screenshotUrl: 'easypaisa_pending',
      status:        'pending',
      easypaisaRef:  orderRefNum,
    }
    if (itemType === 'course') paymentData.courseId = itemId
    else paymentData.chapterId = itemId
    await Payment.create(paymentData)

    // ── Prepare JSON Payload ──
    const payloadObj = {
      storeId: EP_STORE_ID,
      paymentMethod: 'QR_PAYMENT_METHOD',
      orderRefNum: orderRefNum,
      amount: formatAmount(price),
      transactionPointNum: '',
      productNumber: ''
    }

    // Convert exactly to JSON string to sign it
    const jsonString = JSON.stringify(payloadObj)
    
    // Generate RSA Signature
    const signature = generateRSASignature(jsonString)
    
    // Append signature to payload
    const finalPayload = {
      ...payloadObj,
      signature
    }

    // ── Send REST API Request to Easypaisa ──
    const credentials = Buffer.from(`${EP_API_USERNAME}:${EP_API_PASSWORD}`).toString('base64')
    
    const response = await fetch(EP_QR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Credentials': credentials
      },
      body: JSON.stringify(finalPayload)
    })

    const data = await response.json()
    console.log('[Easypaisa QR] Response:', data)

    if (data.responseCode !== '0000') {
      return apiError(data.responseDesc || 'Failed to generate QR', 400)
    }

    return Response.json({
      qrCodeBase64: data.qrCode, // Frontend can display <img src="data:image/png;base64,..." />
      orderRefNum: orderRefNum
    })

  } catch (err: any) {
    console.error('[Easypaisa QR] Error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

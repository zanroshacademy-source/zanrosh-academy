import { getServerAuth, getServerUser } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { apiError } from '@/lib/utils'
import { z } from 'zod'
import crypto from 'crypto'

const JC_MERCHANT_ID = 'MC870331' // from their example
const JC_PASSWORD = 'null'
const JC_SALT = 'null' // they used 'null' in their example script for salt
const JC_RETURN_URL_PATH = '/api/jazzcash/verify'

const InitSessionSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(['course', 'chapter']),
  customerMobile: z.string().optional(),
})

const getAppUrl = () => {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

function generateHash(salt: string, params: Record<string, string>) {
  const sortedKeys = Object.keys(params).filter(k => k.startsWith('pp_') && k !== 'pp_SecureHash').sort()
  let hashString = salt
  for (const key of sortedKeys) {
    if (params[key] && params[key] !== '') {
      hashString += '&' + params[key]
    }
  }
  
  const hmac = crypto.createHmac('sha256', salt)
  hmac.update(hashString)
  return hmac.digest('hex')
}

function formatAmount(price: number) {
  // JazzCash requires amount in minor units (e.g., 10000 for PKR 100.00)
  // Wait, their example has pp_Amount = 10000. Let's assume price is passed in major units (PKR), so we multiply by 100
  return (price * 100).toString()
}

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)
    const user = await getServerUser()

    const body = await request.json()
    const parsed = InitSessionSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { itemId, itemType, customerMobile } = parsed.data

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

    const txnRefNo = 'T' + new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14) + Math.floor(Math.random() * 1000)
    
    // Create pending Payment & Purchase
    const paymentData: any = {
      userId,
      method: 'jazzcash',
      amount: price,
      transactionId: txnRefNo,
      screenshotUrl: 'jazzcash_checkout',
      status: 'pending',
      jazzcashRef: txnRefNo,
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

    const now = new Date()
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const formatDt = (d: Date) => d.toISOString().replace(/[-:T.]/g, '').slice(0, 14)

    const appUrl = getAppUrl()

    const params: Record<string, string> = {
      pp_Version: '2.0',
      pp_TxnType: '', // can leave empty or specific
      pp_IsRegisteredCustomer: 'No',
      pp_TokenizedCardNumber: '',
      pp_CustomerID: userId.slice(0, 20),
      pp_CustomerEmail: user?.emailAddresses?.[0]?.emailAddress || 'student@zanroshacademy.com',
      pp_CustomerMobile: customerMobile || '03001234567',
      pp_MerchantID: JC_MERCHANT_ID,
      pp_Language: 'EN',
      pp_SubMerchantID: '',
      pp_Password: JC_PASSWORD,
      pp_TxnRefNo: txnRefNo,
      pp_Amount: formatAmount(price),
      pp_DiscountedAmount: '',
      pp_DiscountBank: '',
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: formatDt(now),
      pp_TxnExpiryDateTime: formatDt(expiry),
      pp_BillReference: `ZA-${itemType}-${itemId.slice(0, 8)}`,
      pp_Description: 'Zanrosh Academy Purchase',
      pp_ReturnURL: `${appUrl}${JC_RETURN_URL_PATH}`,
      ppmpf_1: '1',
      ppmpf_2: '2',
      ppmpf_3: '3',
      ppmpf_4: '4',
      ppmpf_5: '5',
    }

    const secureHash = generateHash(JC_SALT, params)
    params.pp_SecureHash = secureHash

    return Response.json({
      endpoint: 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/',
      params
    })

  } catch (err: any) {
    console.error('[JazzCash] Session error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

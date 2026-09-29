import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import Chapter from '@/models/Chapter'
import { apiError } from '@/lib/utils'
import { getServerAuth } from '@/lib/server-auth'

// ─── Easypaisa REST API Config ───────────────────────────────────────────────
const EP_STORE_ID    = process.env.EASYPAISA_STORE_ID    || '1294821'
const EP_API_USER    = process.env.EASYPAISA_API_USERNAME || ''
const EP_API_PASS    = process.env.EASYPAISA_API_PASSWORD || ''
const EP_ACCOUNT_NUM = process.env.EASYPAISA_ACCOUNT_NUM  || '173397419'
// Force Sandbox mode for now as requested by user
const EP_SANDBOX     = true

const EP_INQUIRE_URL = EP_SANDBOX
  ? 'https://easypaystg.easypaisa.com.pk/easypay-service/rest/v4/inquire-transaction'
  : 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/inquire-transaction'

function getCredentialsHeader(): string {
  return Buffer.from(`${EP_API_USER}:${EP_API_PASS}`).toString('base64')
}

/**
 * GET /api/easypaisa/verify?orderId=ZAN-XXXX
 * Frontend polls this to check if the user approved the USSD prompt.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    if (!orderId) return apiError('Missing orderId', 400)

    await connectDB()

    const payment = await Payment.findOne({ easypaisaRef: orderId, userId })
    if (!payment) return apiError('Payment not found', 404)

    // Already approved
    if (payment.status === 'approved') {
      const itemId = payment.courseId?.toString() || payment.chapterId?.toString() || ''
      const itemType = payment.courseId ? 'course' : 'chapter'
      return Response.json({ status: 'PAID', itemId, itemType })
    }

    // ── Call Easypaisa Inquire Transaction API ─────────────────────────────────
    const inquireBody = {
      orderId,
      storeId:    EP_STORE_ID,
      accountNum: EP_ACCOUNT_NUM,
    }

    console.log('[Easypaisa] Inquire transaction:', inquireBody)

    const epRes = await fetch(EP_INQUIRE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Credentials':  getCredentialsHeader(),
      },
      body: JSON.stringify(inquireBody),
    })

    const epData = await epRes.json()
    console.log('[Easypaisa] Inquire response:', epData)

    const txStatus = epData.transactionStatus || 'PENDING'

    if (txStatus === 'PAID') {
      // ── Payment confirmed — create Purchase ───────────────────────────────────
      payment.status = 'approved'
      payment.transactionId = epData.transactionId || orderId
      await payment.save()

      const existingPurchase = await Purchase.findOne({ paymentId: payment._id })
      if (!existingPurchase) {
        let expiresAt: Date | null = null
        if (payment.chapterId) {
          const chapter = await Chapter.findById(payment.chapterId).select('accessDays').lean()
          const days = (chapter as any)?.accessDays ?? 15
          expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        }

        const pd: any = { userId, paymentId: payment._id, status: 'approved' }
        if (payment.courseId)  pd.courseId  = payment.courseId
        if (payment.chapterId) { pd.chapterId = payment.chapterId; if (expiresAt) pd.expiresAt = expiresAt }
        await Purchase.create(pd)
      }

      const itemId   = payment.courseId?.toString() || payment.chapterId?.toString() || ''
      const itemType = payment.courseId ? 'course' : 'chapter'
      return Response.json({ status: 'PAID', itemId, itemType })
    }

    if (txStatus === 'FAILED' || txStatus === 'BLOCKED' || txStatus === 'REVERSED') {
      payment.status = 'rejected'
      await payment.save()
      return Response.json({ status: 'FAILED', message: epData.responseDesc || 'Payment failed' })
    }

    // PENDING or EXPIRED — keep polling
    return Response.json({ status: txStatus })

  } catch (err: any) {
    console.error('[Easypaisa] verify error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

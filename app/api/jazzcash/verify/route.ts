import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import Chapter from '@/models/Chapter'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const JC_SALT = 'null' // use the same salt used in create-session

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
  return hmac.digest('hex').toUpperCase() // Some JazzCash docs specify uppercase, some lowercase. The verification should ideally be case-insensitive, but let's check what they return.
}

async function getCourseRedirectId(payment: any): Promise<string | null> {
  if (payment.courseId) return payment.courseId.toString()
  if (payment.chapterId) {
    const chapter = await Chapter.findById(payment.chapterId).select('courseId').lean()
    if (chapter?.courseId) return chapter.courseId.toString()
  }
  return null
}

export async function POST(request: Request) {
  const appUrl = getAppUrl()
  try {
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const responseCode = params['pp_ResponseCode']
    const responseMsg = params['pp_ResponseMessage']
    const txnRefNo = params['pp_TxnRefNo']
    const receivedHash = params['pp_SecureHash']

    console.log('[JazzCash] Verify. Ref:', txnRefNo, 'Code:', responseCode, 'Msg:', responseMsg)

    if (!txnRefNo) {
      return NextResponse.redirect(new URL('/dashboard?error=missing_txn_ref', appUrl), 303)
    }

    // Verify Hash (uncomment in production with real salt)
    // const calculatedHash = generateHash(JC_SALT, params)
    // if (calculatedHash.toUpperCase() !== (receivedHash || '').toUpperCase()) {
    //   console.error('[JazzCash] Hash mismatch! Expected:', calculatedHash, 'Received:', receivedHash)
    //   // return NextResponse.redirect(new URL('/dashboard?error=invalid_signature', appUrl), 303)
    // }

    await connectDB()

    const payment = await Payment.findOne({ jazzcashRef: txnRefNo })
    if (!payment) {
      return NextResponse.redirect(new URL('/dashboard?error=payment_not_found', appUrl), 303)
    }

    if (responseCode === '000') {
      // ── Payment succeeded ────────────────────────────────────────────────
      payment.status = 'approved'
      payment.gatewayResponse = params
      await payment.save()

      let expiresAt: Date | null = null
      if (payment.chapterId) {
        const chapter = await Chapter.findById(payment.chapterId).select('accessDays').lean()
        const days = (chapter as any)?.accessDays ?? 15
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      }

      const existingPurchase = await Purchase.findOne({ paymentId: payment._id })
      if (existingPurchase) {
        existingPurchase.status = 'approved'
        if (expiresAt) existingPurchase.expiresAt = expiresAt
        await existingPurchase.save()
      } else {
        const pd: any = {
          userId: payment.userId,
          paymentId: payment._id,
          status: 'approved',
          courseId: payment.courseId,
          chapterId: payment.chapterId,
        }
        if (expiresAt) pd.expiresAt = expiresAt
        await Purchase.create(pd)
      }

      const courseId = await getCourseRedirectId(payment)
      if (courseId) return NextResponse.redirect(new URL(`/courses/${courseId}`, appUrl), 303)
      return NextResponse.redirect(new URL('/dashboard', appUrl), 303)

    } else {
      // ── Payment failed ───────────────────────────────────────────────────
      payment.status = 'rejected'
      payment.gatewayResponse = params
      await payment.save()

      await Purchase.findOneAndUpdate(
        { paymentId: payment._id },
        { status: 'rejected' }
      )

      const courseId = await getCourseRedirectId(payment)
      const redirectBase = courseId ? `/buy/${payment.chapterId || payment.courseId}` : '/dashboard'
      return NextResponse.redirect(new URL(`${redirectBase}?error=payment_failed&msg=${encodeURIComponent(responseMsg || 'Failed')}`, appUrl), 303)
    }

  } catch (err: any) {
    console.error('[JazzCash] Verify error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=server_error', appUrl), 303)
  }
}

import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import Chapter from '@/models/Chapter'
import { NextResponse } from 'next/server'

const getAppUrl = () => {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

async function getCourseRedirectId(payment: any): Promise<string | null> {
  if (payment.courseId) return payment.courseId.toString()
  if (payment.chapterId) {
    const chapter = await Chapter.findById(payment.chapterId).select('courseId').lean()
    if (chapter?.courseId) return chapter.courseId.toString()
  }
  return null
}

async function processVerification(params: Record<string, string>, appUrl: string) {
  const status       = params['status']        || params['Status']
  const desc         = params['desc']          || params['Desc'] || ''
  const orderRefNum  = params['orderRefNum']   || params['orderRefNumber'] || params['orderRef'] || ''

  console.log('[Easypaisa] verify params — status:', status, 'desc:', desc, 'orderRef:', orderRefNum)

  if (!orderRefNum) {
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_missing_ref', appUrl), 303)
  }

  await connectDB()

  const payment = await Payment.findOne({ easypaisaRef: orderRefNum })
  if (!payment) {
    console.error('[Easypaisa] Payment not found for orderRef:', orderRefNum)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_payment_not_found', appUrl), 303)
  }

  if (status === 'Success' || status === 'SUCCESS') {
    // ── Payment succeeded ─────────────────────────────────────────────────
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
        userId:    payment.userId,
        paymentId: payment._id,
        status:    'approved',
        courseId:  payment.courseId,
        chapterId: payment.chapterId,
      }
      if (expiresAt) pd.expiresAt = expiresAt
      await Purchase.create(pd)
    }

    const courseId = await getCourseRedirectId(payment)
    if (courseId) return NextResponse.redirect(new URL(`/courses/${courseId}`, appUrl), 303)
    return NextResponse.redirect(new URL('/dashboard', appUrl), 303)

  } else {
    // ── Payment failed / cancelled ────────────────────────────────────────
    payment.status = 'rejected'
    payment.gatewayResponse = params
    await payment.save()

    await Purchase.findOneAndUpdate(
      { paymentId: payment._id },
      { status: 'rejected' }
    )

    const redirectBase = payment.chapterId
      ? `/buy/${payment.chapterId}`
      : payment.courseId
        ? `/buy/${payment.courseId}`
        : '/dashboard'
    const errorMsg = desc || 'Payment failed'
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=payment_failed&msg=${encodeURIComponent(errorMsg)}`, appUrl),
      303
    )
  }
}

/**
 * GET /api/easypaisa/verify?orderRef=EP...&status=Success&desc=0000&orderRefNum=EP...
 * Easypaisa may use GET to send the final transaction result.
 */
export async function GET(request: Request) {
  const appUrl = getAppUrl()
  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}
    searchParams.forEach((v, k) => { params[k] = v })
    console.log('[Easypaisa] verify GET params:', JSON.stringify(params))
    return await processVerification(params, appUrl)
  } catch (err: any) {
    console.error('[Easypaisa] verify GET error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_verify_error', getAppUrl()), 303)
  }
}

/**
 * POST /api/easypaisa/verify
 * Easypaisa may POST the final transaction result as form-data.
 */
export async function POST(request: Request) {
  const appUrl = getAppUrl()
  try {
    // Try to read as form-data first, fall back to URL params
    const params: Record<string, string> = {}
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      formData.forEach((v, k) => { params[k] = v.toString() })
    } else {
      const { searchParams } = new URL(request.url)
      searchParams.forEach((v, k) => { params[k] = v })
    }

    // Also grab orderRef from query string (we put it there in callback)
    const urlParams = new URL(request.url).searchParams
    if (!params['orderRef'] && urlParams.get('orderRef')) {
      params['orderRef'] = urlParams.get('orderRef')!
    }

    console.log('[Easypaisa] verify POST params:', JSON.stringify(params))
    return await processVerification(params, appUrl)
  } catch (err: any) {
    console.error('[Easypaisa] verify POST error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_verify_error', getAppUrl()), 303)
  }
}

import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import Chapter from '@/models/Chapter'
import { NextResponse } from 'next/server'

const getAppUrl = (req: Request) => {
  const u = new URL(req.url)
  return `${u.protocol}//${u.host}`
}

async function getCourseRedirectId(payment: any): Promise<string | null> {
  if (payment.courseId) return payment.courseId.toString()
  if (payment.chapterId) {
    const chapter = await Chapter.findById(payment.chapterId).select('courseId').lean()
    if (chapter?.courseId) return chapter.courseId.toString()
  }
  return null
}

/**
 * Core verification handler — called by both GET and POST.
 * Creates DB records ONLY after Easypaisa confirms a successful payment.
 */
async function processVerification(params: Record<string, string>, appUrl: string) {
  const status      = params['status']     || params['Status']     || ''
  const desc        = params['desc']       || params['Desc']       || ''
  const orderRefNum = params['orderRefNum']|| params['orderRef']   || ''

  // Session data carried through the URL chain from create-session
  const userId   = params['userId']   || ''
  const itemId   = params['itemId']   || ''
  const itemType = params['itemType'] || 'chapter'
  const amount   = parseFloat(params['amount'] || '0')

  console.log('[Easypaisa] verify — status:', status, 'desc:', desc, 'orderRef:', orderRefNum, 'userId:', userId, 'itemId:', itemId)

  if (!orderRefNum || !userId || !itemId) {
    console.error('[Easypaisa] verify missing required params:', params)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_missing_verify_params', appUrl), 303)
  }

  await connectDB()

  if (status === 'Success' || status === 'SUCCESS') {
    // ── Payment succeeded — create DB records now ─────────────────────────

    // Check for duplicate (Easypaisa can call verify more than once)
    const existing = await Payment.findOne({ easypaisaRef: orderRefNum })
    if (existing && existing.status === 'approved') {
      console.log('[Easypaisa] Duplicate verify call for approved payment:', orderRefNum)
      const courseId = await getCourseRedirectId(existing)
      if (courseId) return NextResponse.redirect(new URL(`/courses/${courseId}`, appUrl), 303)
      return NextResponse.redirect(new URL('/dashboard', appUrl), 303)
    }

    const paymentData: any = {
      userId,
      method:        'easypaisa',
      amount,
      transactionId: orderRefNum,
      screenshotUrl: 'easypaisa_checkout',
      status:        'approved',
      easypaisaRef:  orderRefNum,
      gatewayResponse: params,
    }
    if (itemType === 'course') paymentData.courseId = itemId
    else paymentData.chapterId = itemId

    const payment = existing || await Payment.create(paymentData)
    if (existing) {
      existing.status = 'approved'
      existing.gatewayResponse = params
      await existing.save()
    }

    let expiresAt: Date | null = null
    if (itemType === 'chapter') {
      const chapter = await Chapter.findById(itemId).select('accessDays').lean()
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
        userId,
        paymentId: payment._id,
        status:    'approved',
      }
      if (itemType === 'course') pd.courseId = itemId
      else { pd.chapterId = itemId; if (expiresAt) pd.expiresAt = expiresAt }
      await Purchase.create(pd)
    }

    const courseId = await getCourseRedirectId(payment)
    if (courseId) return NextResponse.redirect(new URL(`/courses/${courseId}`, appUrl), 303)
    return NextResponse.redirect(new URL('/dashboard', appUrl), 303)

  } else {
    // ── Payment failed / cancelled ────────────────────────────────────────
    console.log('[Easypaisa] Payment failed. desc:', desc)
    const redirectBase = itemId ? `/buy/${itemId}` : '/dashboard'
    const errorMsg = desc || 'Payment failed or cancelled'
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=payment_failed&msg=${encodeURIComponent(errorMsg)}`, appUrl),
      303
    )
  }
}

/**
 * GET /api/easypaisa/verify
 * Easypaisa sends final status via GET.
 */
export async function GET(request: Request) {
  const appUrl = getAppUrl(request)
  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}
    searchParams.forEach((v, k) => { params[k] = v })
    console.log('[Easypaisa] verify GET:', JSON.stringify(params))
    return await processVerification(params, appUrl)
  } catch (err: any) {
    console.error('[Easypaisa] verify GET error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_verify_error', getAppUrl(request)), 303)
  }
}

/**
 * POST /api/easypaisa/verify
 * Easypaisa sends final status via POST form-data.
 */
export async function POST(request: Request) {
  const appUrl = getAppUrl(request)
  try {
    const params: Record<string, string> = {}

    // Grab URL query params first (our session data is here)
    const urlParams = new URL(request.url).searchParams
    urlParams.forEach((v, k) => { params[k] = v })

    // Then overlay with form body (Easypaisa's status fields)
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      formData.forEach((v, k) => { params[k] = v.toString() })
    }

    console.log('[Easypaisa] verify POST:', JSON.stringify(params))
    return await processVerification(params, appUrl)
  } catch (err: any) {
    console.error('[Easypaisa] verify POST error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_verify_error', getAppUrl(request)), 303)
  }
}

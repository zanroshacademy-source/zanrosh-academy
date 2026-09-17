import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import Chapter from '@/models/Chapter'
import { NextResponse } from 'next/server'

const getAppUrl = (req: Request) => {
  const u = new URL(req.url)
  return `${u.protocol}//${u.host}`
}

/**
 * Core verification handler.
 * Easypaisa calls this URL after the customer confirms payment on their side.
 * Session data (userId, itemId, itemType) is stored in the pending Payment record.
 */
async function processVerification(orderRef: string, status: string, desc: string, appUrl: string) {
  console.log('[Easypaisa] verify — status:', status, 'desc:', desc, 'orderRef:', orderRef)

  if (!orderRef) {
    console.error('[Easypaisa] verify: missing orderRef')
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_missing_ref', appUrl), 303)
  }

  await connectDB()

  // Look up the pending Payment record by orderRef (stored as easypaisaRef in create-session)
  const payment = await Payment.findOne({ easypaisaRef: orderRef })
  if (!payment) {
    console.error('[Easypaisa] verify: no payment found for orderRef:', orderRef)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_not_found', appUrl), 303)
  }

  const { userId, courseId, chapterId } = payment
  const itemId   = courseId?.toString() || chapterId?.toString() || ''
  const itemType = courseId ? 'course' : 'chapter'

  if (status === 'Success' || status === 'SUCCESS') {
    // ── Approve payment ────────────────────────────────────────────────────────
    if (payment.status === 'approved') {
      // Already approved (duplicate call from Easypaisa) — just redirect
      console.log('[Easypaisa] Duplicate verify for already-approved payment:', orderRef)
    } else {
      payment.status = 'approved'
      payment.transactionId = orderRef
      await payment.save()
    }

    // Create or update Purchase record
    const existingPurchase = await Purchase.findOne({ paymentId: payment._id })
    if (!existingPurchase) {
      let expiresAt: Date | null = null
      if (itemType === 'chapter' && chapterId) {
        const chapter = await Chapter.findById(chapterId).select('accessDays').lean()
        const days = (chapter as any)?.accessDays ?? 15
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      }

      const pd: any = { userId, paymentId: payment._id, status: 'approved' }
      if (itemType === 'course') pd.courseId = courseId
      else { pd.chapterId = chapterId; if (expiresAt) pd.expiresAt = expiresAt }
      await Purchase.create(pd)
    } else {
      existingPurchase.status = 'approved'
      await existingPurchase.save()
    }

    // Redirect to course
    const courseId2 = courseId?.toString() || null
    if (courseId2) return NextResponse.redirect(new URL(`/courses/${courseId2}`, appUrl), 303)
    if (chapterId) {
      const chapter = await Chapter.findById(chapterId).select('courseId').lean()
      if (chapter?.courseId) return NextResponse.redirect(new URL(`/courses/${chapter.courseId}`, appUrl), 303)
    }
    return NextResponse.redirect(new URL('/dashboard', appUrl), 303)

  } else {
    // ── Payment failed ─────────────────────────────────────────────────────────
    payment.status = 'rejected'
    await payment.save()

    const redirectBase = itemId ? `/buy/${itemId}` : '/dashboard'
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=payment_failed&msg=${encodeURIComponent(desc || 'Payment failed')}`, appUrl),
      303
    )
  }
}

export async function GET(request: Request) {
  const appUrl = getAppUrl(request)
  try {
    const { searchParams } = new URL(request.url)
    const status   = searchParams.get('status')         || searchParams.get('Status')         || ''
    const desc     = searchParams.get('desc')           || searchParams.get('Desc')           || ''
    const orderRef = searchParams.get('orderRefNumber') || searchParams.get('orderRefNum')    || searchParams.get('orderRef') || ''
    console.log('[Easypaisa] verify GET params:', { status, desc, orderRef })
    return await processVerification(orderRef, status, desc, appUrl)
  } catch (err: any) {
    console.error('[Easypaisa] verify GET error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_verify_error', appUrl), 303)
  }
}

export async function POST(request: Request) {
  const appUrl = getAppUrl(request)
  try {
    const params: Record<string, string> = {}

    // URL query params (our orderRef)
    const urlSearch = new URL(request.url).searchParams
    urlSearch.forEach((v, k) => { params[k] = v })

    // Form body (Easypaisa's status/desc/orderRefNumber)
    const ct = request.headers.get('content-type') || ''
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      try {
        const formData = await request.formData()
        formData.forEach((v, k) => { params[k] = v.toString() })
      } catch { /* ignore */ }
    }

    const status   = params['status']         || params['Status']         || ''
    const desc     = params['desc']           || params['Desc']           || ''
    const orderRef = params['orderRefNumber'] || params['orderRefNum']    || params['orderRef'] || ''
    console.log('[Easypaisa] verify POST params:', { status, desc, orderRef })
    return await processVerification(orderRef, status, desc, appUrl)
  } catch (err: any) {
    console.error('[Easypaisa] verify POST error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_verify_error', appUrl), 303)
  }
}

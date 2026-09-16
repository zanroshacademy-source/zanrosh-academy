import { NextResponse } from 'next/server'

const EP_CONFIRM_URL = 'https://easypay.easypaisa.com.pk/easypay/Confirm.jsf'

/** Derives base URL from the live incoming request — always correct on production */
const getAppUrl = (req: Request) => {
  const u = new URL(req.url)
  return `${u.protocol}//${u.host}`
}

/**
 * GET /api/easypaisa/callback?auth_token=TOKEN&orderRef=EP...
 *
 * Easypaisa redirects the customer here after they complete the checkout form.
 * This handler:
 *   1. Reads auth_token and orderRef from query params
 *   2. POSTs auth_token + our verify URL to Easypaisa Confirm.jsf (server-to-server)
 *   3. Redirects the user to dashboard with a processing message
 */
export async function GET(request: Request) {
  const appUrl = getAppUrl(request)
  try {
    const { searchParams } = new URL(request.url)
    const authToken = searchParams.get('auth_token') || ''
    const orderRef  = searchParams.get('orderRef') || ''

    console.log('[Easypaisa] callback GET. auth_token:', authToken, 'orderRef:', orderRef, 'appUrl:', appUrl)

    if (!authToken || !orderRef) {
      console.error('[Easypaisa] callback missing auth_token or orderRef')
      return NextResponse.redirect(new URL('/dashboard?error=easypaisa_missing_token', appUrl), 303)
    }

    // postBackURL2 — where Easypaisa will send final status/desc/orderRefNumber
    const verifyUrl = `${appUrl}/api/easypaisa/verify?orderRef=${encodeURIComponent(orderRef)}`

    console.log('[Easypaisa] Posting to Confirm.jsf. verifyUrl:', verifyUrl)

    // Server-side POST to Easypaisa Confirm.jsf to complete the handshake
    const confirmRes = await fetch(EP_CONFIRM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        auth_token:  authToken,
        postBackURL: verifyUrl,
      }).toString(),
      redirect: 'manual',
    })

    console.log('[Easypaisa] Confirm.jsf response status:', confirmRes.status)

    return NextResponse.redirect(
      new URL('/dashboard?easypaisa=processing', appUrl),
      303
    )
  } catch (err: any) {
    console.error('[Easypaisa] callback GET error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_callback_error', appUrl), 303)
  }
}

/**
 * POST /api/easypaisa/callback
 * Some Easypaisa configurations POST to the postBackURL instead of GET.
 */
export async function POST(request: Request) {
  const appUrl = getAppUrl(request)
  try {
    const formData = await request.formData()
    const authToken = formData.get('auth_token')?.toString() || ''
    const orderRef  = (new URL(request.url)).searchParams.get('orderRef') || ''

    console.log('[Easypaisa] callback POST. auth_token:', authToken, 'orderRef:', orderRef, 'appUrl:', appUrl)

    if (!authToken || !orderRef) {
      return NextResponse.redirect(new URL('/dashboard?error=easypaisa_missing_token', appUrl), 303)
    }

    const verifyUrl = `${appUrl}/api/easypaisa/verify?orderRef=${encodeURIComponent(orderRef)}`

    await fetch(EP_CONFIRM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        auth_token:  authToken,
        postBackURL: verifyUrl,
      }).toString(),
      redirect: 'manual',
    })

    return NextResponse.redirect(
      new URL('/dashboard?easypaisa=processing', appUrl),
      303
    )
  } catch (err: any) {
    console.error('[Easypaisa] callback POST error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_callback_error', appUrl), 303)
  }
}

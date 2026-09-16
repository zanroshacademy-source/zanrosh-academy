import { NextResponse } from 'next/server'

const EP_CONFIRM_URL = 'https://easypay.easypaisa.com.pk/easypay/Confirm.jsf'

const getAppUrl = () => {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

/**
 * GET /api/easypaisa/callback?auth_token=TOKEN&orderRef=EP...
 *
 * Easypaisa redirects the customer here after they complete the checkout form.
 * This handler:
 *   1. Reads auth_token and orderRef from query params
 *   2. POSTs auth_token + our verify URL to Easypaisa Confirm.jsf (server-to-server)
 *   3. Redirects the user to a waiting/processing page
 *      (Easypaisa will then call our /api/easypaisa/verify with final status)
 */
export async function GET(request: Request) {
  const appUrl = getAppUrl()
  try {
    const { searchParams } = new URL(request.url)
    const authToken  = searchParams.get('auth_token') || ''
    const orderRef   = searchParams.get('orderRef') || ''

    console.log('[Easypaisa] callback received. auth_token:', authToken, 'orderRef:', orderRef)

    if (!authToken || !orderRef) {
      console.error('[Easypaisa] callback missing auth_token or orderRef')
      return NextResponse.redirect(new URL('/dashboard?error=easypaisa_missing_token', appUrl), 303)
    }

    // postBackURL2 — where Easypaisa will send final status/desc/orderRefNumber
    const verifyUrl = `${appUrl}/api/easypaisa/verify?orderRef=${encodeURIComponent(orderRef)}`

    // Server-side POST to Easypaisa Confirm.jsf to complete the handshake
    const confirmRes = await fetch(EP_CONFIRM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        auth_token:  authToken,
        postBackURL: verifyUrl,
      }).toString(),
      redirect: 'manual', // Easypaisa may redirect; we don't follow it server-side
    })

    console.log('[Easypaisa] Confirm.jsf response status:', confirmRes.status)

    // Redirect user to a "processing" page while Easypaisa finalises
    return NextResponse.redirect(
      new URL(`/api/easypaisa/processing?orderRef=${encodeURIComponent(orderRef)}`, appUrl),
      303
    )
  } catch (err: any) {
    console.error('[Easypaisa] callback error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_callback_error', appUrl), 303)
  }
}

/**
 * POST /api/easypaisa/callback
 * Some Easypaisa configurations POST to the postBackURL instead of GET.
 * We handle both.
 */
export async function POST(request: Request) {
  const appUrl = getAppUrl()
  try {
    const formData = await request.formData()
    const authToken = formData.get('auth_token')?.toString() || ''
    const orderRef  = (new URL(request.url)).searchParams.get('orderRef') || ''

    console.log('[Easypaisa] callback POST. auth_token:', authToken, 'orderRef:', orderRef)

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
      new URL(`/api/easypaisa/processing?orderRef=${encodeURIComponent(orderRef)}`, appUrl),
      303
    )
  } catch (err: any) {
    console.error('[Easypaisa] callback POST error:', err)
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_callback_error', appUrl), 303)
  }
}

import { NextResponse } from 'next/server'

const EP_SANDBOX = process.env.EASYPAISA_SANDBOX === 'true'

const EP_CONFIRM_URL = EP_SANDBOX
  ? 'https://easypaystg.easypaisa.com.pk/easypay/Confirm.jsf'
  : 'https://easypay.easypaisa.com.pk/easypay/Confirm.jsf'

const getAppUrl = (req: Request) => {
  const u = new URL(req.url)
  return `${u.protocol}//${u.host}`
}

/**
 * GET /api/easypaisa/callback?auth_token=TOKEN&orderRef=EP...&userId=...&itemId=...
 *
 * Easypaisa redirects the customer here after they fill the checkout form.
 * We forward the auth_token to Confirm.jsf then carry session data to verify.
 */
export async function GET(request: Request) {
  const appUrl = getAppUrl(request)
  const { searchParams } = new URL(request.url)

  const authToken = searchParams.get('auth_token') || ''
  const orderRef  = searchParams.get('orderRef')   || ''
  const userId    = searchParams.get('userId')     || ''
  const itemId    = searchParams.get('itemId')     || ''
  const itemType  = searchParams.get('itemType')   || ''
  const amount    = searchParams.get('amount')     || ''

  console.log('[Easypaisa] callback GET. sandbox:', EP_SANDBOX, 'auth_token:', authToken, 'orderRef:', orderRef)

  if (!authToken) {
    // Easypaisa redirected back without auth_token — user cancelled or store ID is wrong
    console.error('[Easypaisa] No auth_token received — Easypaisa rejected the request')
    const redirectBase = itemId ? `/buy/${itemId}` : '/dashboard'
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=easypaisa_cancelled`, appUrl),
      303
    )
  }

  if (!orderRef || !userId || !itemId) {
    console.error('[Easypaisa] callback missing required params')
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_missing_params', appUrl), 303)
  }

  try {
    // Build verifyUrl carrying all session context
    const verifyParams = new URLSearchParams({
      orderRef,
      userId,
      itemId,
      itemType,
      amount,
    }).toString()
    const verifyUrl = `${appUrl}/api/easypaisa/verify?${verifyParams}`

    console.log('[Easypaisa] Redirecting customer to Confirm.jsf. verifyUrl:', verifyUrl)

    // We must POST auth_token to Confirm.jsf from the CUSTOMER'S BROWSER,
    // so they see the Easypaisa UI. A server-side fetch hides the UI.
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Redirecting to Easypaisa...</title></head>
      <body onload="document.forms[0].submit()">
        <form action="${EP_CONFIRM_URL}" method="POST" style="display:none;">
          <input type="hidden" name="auth_token" value="${authToken}" />
          <input type="hidden" name="postBackURL" value="${verifyUrl}" />
        </form>
        <p>Redirecting to secure checkout...</p>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (err: any) {
    console.error('[Easypaisa] callback GET error:', err)
    return NextResponse.redirect(new URL(`/buy/${itemId}?error=easypaisa_error`, appUrl), 303)
  }
}

/**
 * POST /api/easypaisa/callback — some configs POST instead of GET
 */
export async function POST(request: Request) {
  const appUrl    = getAppUrl(request)
  const urlSearch = new URL(request.url).searchParams

  const orderRef = urlSearch.get('orderRef') || ''
  const userId   = urlSearch.get('userId')   || ''
  const itemId   = urlSearch.get('itemId')   || ''
  const itemType = urlSearch.get('itemType') || ''
  const amount   = urlSearch.get('amount')   || ''

  let authToken = ''
  try {
    const formData = await request.formData()
    authToken = formData.get('auth_token')?.toString() || ''
  } catch {
    authToken = urlSearch.get('auth_token') || ''
  }

  console.log('[Easypaisa] callback POST. auth_token:', authToken, 'orderRef:', orderRef)

  if (!authToken) {
    const redirectBase = itemId ? `/buy/${itemId}` : '/dashboard'
    return NextResponse.redirect(new URL(`${redirectBase}?error=easypaisa_cancelled`, appUrl), 303)
  }

  try {
    const verifyParams = new URLSearchParams({ orderRef, userId, itemId, itemType, amount }).toString()
    const verifyUrl = `${appUrl}/api/easypaisa/verify?${verifyParams}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Redirecting to Easypaisa...</title></head>
      <body onload="document.forms[0].submit()">
        <form action="${EP_CONFIRM_URL}" method="POST" style="display:none;">
          <input type="hidden" name="auth_token" value="${authToken}" />
          <input type="hidden" name="postBackURL" value="${verifyUrl}" />
        </form>
        <p>Redirecting to secure checkout...</p>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (err: any) {
    console.error('[Easypaisa] callback POST error:', err)
    return NextResponse.redirect(new URL(`/buy/${itemId}?error=easypaisa_error`, appUrl), 303)
  }
}

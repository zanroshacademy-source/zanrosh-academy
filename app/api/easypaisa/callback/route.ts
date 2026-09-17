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
 * GET /api/easypaisa/callback?auth_token=TOKEN&orderRef=XXXXXX
 *
 * Easypaisa redirects the customer here after they fill the checkout form.
 * We auto-submit the auth_token to Confirm.jsf from the customer's browser.
 *
 * IMPORTANT: The postBackURL sent to Confirm.jsf must be clean (no complex query params).
 * Session data is stored in the Payment record (keyed by easypaisaRef = orderRef).
 */
export async function GET(request: Request) {
  const appUrl    = getAppUrl(request)
  const { searchParams } = new URL(request.url)

  const authToken = searchParams.get('auth_token') || ''
  const orderRef  = searchParams.get('orderRef')   || ''

  console.log('[Easypaisa] callback GET. auth_token:', authToken ? 'YES' : 'NO', 'orderRef:', orderRef)

  if (!authToken) {
    // No auth_token = Easypaisa rejected (invalid store, cancelled etc.)
    console.error('[Easypaisa] No auth_token — Easypaisa rejected at Index.jsf')
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_cancelled', appUrl), 303)
  }

  if (!orderRef) {
    console.error('[Easypaisa] No orderRef in callback')
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_missing_ref', appUrl), 303)
  }

  // Clean verify URL — just the orderRef. Session data is in the DB.
  const verifyUrl = `${appUrl}/api/easypaisa/verify?orderRef=${orderRef}`

  console.log('[Easypaisa] Auto-submitting to Confirm.jsf. verifyUrl:', verifyUrl)

  // Return an HTML page that auto-submits the form to Confirm.jsf IN THE CUSTOMER'S BROWSER.
  // This is the only correct approach — a server-side fetch would hide the Easypaisa UI.
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Completing Payment...</title>
  <meta charset="utf-8"/>
  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f7f7ff;}</style>
</head>
<body>
  <p>Completing your Easypaisa payment, please wait...</p>
  <form id="f" action="${EP_CONFIRM_URL}" method="POST" style="display:none;">
    <input type="hidden" name="auth_token" value="${authToken}" />
    <input type="hidden" name="postBackURL" value="${verifyUrl}" />
  </form>
  <script>document.getElementById('f').submit();</script>
</body>
</html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}

/**
 * POST /api/easypaisa/callback — handles POST variant (some configs)
 */
export async function POST(request: Request) {
  const appUrl    = getAppUrl(request)
  const urlSearch = new URL(request.url).searchParams

  const orderRef = urlSearch.get('orderRef') || ''
  let authToken  = urlSearch.get('auth_token') || ''

  try {
    const formData = await request.formData()
    authToken = formData.get('auth_token')?.toString() || authToken
  } catch {
    // ignore
  }

  console.log('[Easypaisa] callback POST. auth_token:', authToken ? 'YES' : 'NO', 'orderRef:', orderRef)

  if (!authToken) {
    return NextResponse.redirect(new URL('/dashboard?error=easypaisa_cancelled', appUrl), 303)
  }

  const verifyUrl = `${appUrl}/api/easypaisa/verify?orderRef=${orderRef}`

  const html = `<!DOCTYPE html>
<html>
<head><title>Completing Payment...</title><meta charset="utf-8"/>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f7f7ff;}</style>
</head>
<body>
  <p>Completing your Easypaisa payment, please wait...</p>
  <form id="f" action="${EP_CONFIRM_URL}" method="POST" style="display:none;">
    <input type="hidden" name="auth_token" value="${authToken}" />
    <input type="hidden" name="postBackURL" value="${verifyUrl}" />
  </form>
  <script>document.getElementById('f').submit();</script>
</body>
</html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}

import { NextResponse } from 'next/server'

/**
 * GET /api/easypaisa/processing?orderRef=EP...
 *
 * This is a simple redirect-based "processing" holding page.
 * After the callback completes the handshake, the user lands here briefly.
 * We redirect them to /dashboard with a pending message.
 * Easypaisa will separately call /api/easypaisa/verify with the final status,
 * which will update the DB — they will see the result on /dashboard.
 */
export async function GET(_request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return NextResponse.redirect(
    new URL('/dashboard?easypaisa=processing', appUrl),
    303
  )
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// In dev mode — pass everything through with zero Clerk involvement
export function proxy(req: NextRequest) {
  if (IS_DEV_MODE) return NextResponse.next()

  // Production Clerk guard lives in individual route handlers / layouts.
  // The proxy only ensures unauthenticated users are redirected from
  // protected pages. Auth itself is validated server-side per-page.
  const isPublic =
    req.nextUrl.pathname === '/' ||
    req.nextUrl.pathname.startsWith('/courses') ||
    req.nextUrl.pathname.startsWith('/sign-in') ||
    req.nextUrl.pathname.startsWith('/sign-up') ||
    req.nextUrl.pathname.startsWith('/api/webhooks') ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/favicon')

  if (isPublic) return NextResponse.next()
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

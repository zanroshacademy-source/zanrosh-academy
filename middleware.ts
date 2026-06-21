import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'

const IS_DEV = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/courses(.*)',
  '/contact(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/refund(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

// Clerk v5 middleware — wraps the auth guard
const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

// Export a wrapper that passes BOTH request and event to clerkHandler
// (required for Clerk v5 + Next.js 15 compatibility)
export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (IS_DEV) return NextResponse.next()
  return clerkHandler(request, event)
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}

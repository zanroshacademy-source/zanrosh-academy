import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Lightweight endpoint — returns the current user's role from MongoDB.
// Used by client components (e.g. Navbar) that can't import mongoose directly.
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ role: null })

    const { connectDB } = await import('@/lib/db')
    const UserModel = (await import('@/models/User')).default
    await connectDB()

    const user = await UserModel.findOne({ clerkId: userId }).select('role').lean()
    return NextResponse.json({ role: user?.role ?? 'student' }, {
      headers: { 'Cache-Control': 'private, max-age=60' }
    })
  } catch {
    return NextResponse.json({ role: null })
  }
}

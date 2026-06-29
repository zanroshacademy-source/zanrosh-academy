import type { UserRole } from '@/lib/types'
import { auth, currentUser } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'

// ─── Get Clerk userId ──────────────────────────────────────────────
export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

// ─── Sync user to MongoDB & get their role ────────────────────────
export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null

  await connectDB()
  let user = await UserModel.findOne({ clerkId: userId }).lean()

  if (!user) {
    const clerkUser = await currentUser()
    if (!clerkUser) return null

    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User'
    const email = clerkUser.emailAddresses[0]?.emailAddress || ''

    if (email) {
      // Handle Clerk dev -> prod transition: if user exists by email, update their clerkId
      const existingUser = await UserModel.findOne({ email }).lean()
      if (existingUser) {
        user = await UserModel.findOneAndUpdate(
          { email },
          { clerkId: userId, fullName },
          { new: true }
        ).lean()
        return {
          userId,
          role: user.role as UserRole,
          fullName: user.fullName,
          email: user.email,
          _id: user._id?.toString(),
        }
      }
    }

    // The very first user to register becomes super_admin automatically
    const userCount = await UserModel.countDocuments()
    const role: UserRole = userCount === 0 ? 'super_admin' : 'student'

    user = await UserModel.findOneAndUpdate(
      { clerkId: userId },
      { email, fullName, $setOnInsert: { role } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()
  }

  return {
    userId,
    role: user.role as UserRole,
    fullName: user.fullName,
    email: user.email,
    _id: user._id?.toString(),
  }
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser()
  return user?.role ?? null
}

// ─── Role guards ───────────────────────────────────────────────────
export async function isSuperAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === 'super_admin'
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === 'super_admin'
}

export async function isStudent(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === 'student'
}

export async function requireAdmin(): Promise<void> {
  const ok = await isAdmin()
  if (!ok) throw new Error('Unauthorized: Admin only')
}

export async function requireSuperAdmin(): Promise<void> {
  const ok = await isSuperAdmin()
  if (!ok) throw new Error('Unauthorized: Super Admin only')
}

// ─── Chapter / Unit access check ───────────────────────────────────────────
export async function hasChapterAccess(userId: string, chapterId: string): Promise<boolean> {
  // Super admins always have access to everything
  const role = await getCurrentUserRole()
  if (role === 'super_admin') return true

  const Purchase = (await import('@/models/Purchase')).default
  await connectDB()
  const purchase = await Purchase.findOne({ userId, chapterId, status: 'approved' })
  if (!purchase) return false

  // Check expiry — if expiresAt is set and in the past, access is denied
  if (purchase.expiresAt && purchase.expiresAt < new Date()) return false

  return true
}

// ─── Course ownership check (for admins) ──────────────────────────
export async function isCourseOwner(courseId: string, userId: string): Promise<boolean> {
  const superAdmin = await isSuperAdmin()
  if (superAdmin) return true

  const Course = (await import('@/models/Course')).default
  await connectDB()
  const course = await Course.findById(courseId).select('adminId').lean()
  return course?.adminId === userId
}

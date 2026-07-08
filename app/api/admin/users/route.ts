import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { isAdmin, isSuperAdmin } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { z } from 'zod'

// GET /api/admin/users — super_admin: all users; admin: only student list
export async function GET() {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)
    if (!(await isAdmin())) return apiError('Forbidden', 403)

    await connectDB()
    const users = await User.find().sort({ createdAt: -1 }).lean()
    return apiSuccess(users)
  } catch {
    return apiError('Server error', 500)
  }
}

const RoleUpdateSchema = z.object({
  targetUserId: z.string().min(1),
  role: z.enum(['student', 'admin', 'super_admin']),
})

// PATCH /api/admin/users — super_admin only: promote/demote users
export async function PATCH(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const superAdmin = await isSuperAdmin()
    if (!superAdmin) return apiError('Forbidden: Super Admin only', 403)

    const body = await request.json()
    const parsed = RoleUpdateSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { targetUserId, role } = parsed.data

    // Prevent super admin from demoting themselves
    if (targetUserId === userId && role !== 'super_admin') {
      return apiError('Cannot change your own super_admin role', 400)
    }

    await connectDB()
    const updated = await User.findOneAndUpdate(
      { clerkId: targetUserId },
      { role },
      { new: true }
    )
    if (!updated) return apiError('User not found', 404)

    return apiSuccess({ message: `Role updated to ${role}`, user: updated })
  } catch {
    return apiError('Server error', 500)
  }
}

const BanSchema = z.object({
  targetUserId: z.string().min(1),
  isBanned: z.boolean(),
})

// PUT /api/admin/users — super_admin only: ban / unban a user
export async function PUT(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const superAdmin = await isSuperAdmin()
    if (!superAdmin) return apiError('Forbidden: Super Admin only', 403)

    const body = await request.json()
    const parsed = BanSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { targetUserId, isBanned } = parsed.data

    if (targetUserId === userId) return apiError('Cannot ban your own account', 400)

    await connectDB()
    const updated = await User.findOneAndUpdate(
      { clerkId: targetUserId },
      { isBanned },
      { new: true }
    )
    if (!updated) return apiError('User not found', 404)

    return apiSuccess({ message: isBanned ? 'User banned' : 'User unbanned', user: updated })
  } catch {
    return apiError('Server error', 500)
  }
}

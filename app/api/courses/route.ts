import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import User from '@/models/User'
import { isAdmin, isSuperAdmin } from '@/lib/auth'
import { apiError, apiSuccess, slugify } from '@/lib/utils'
import { z } from 'zod'

const CreateCourseSchema = z.object({
  title:       z.string().min(3).max(200),
  description: z.string().min(10),
  thumbnail:   z.string().optional().default(''),
  category:    z.string().optional().default('General'),
  level:       z.string().optional().default('Beginner'),
  price:       z.number().min(0).default(0),
  isFree:      z.boolean().default(false),
})

// GET /api/courses — public list (published), or admin-scoped list
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mine = searchParams.get('mine') === 'true'

    await connectDB()

    if (mine) {
      const { userId } = await getServerAuth()
      if (!userId) return apiError('Unauthorized', 401)

      const superAdmin = await isSuperAdmin()
      const query = superAdmin ? {} : { adminId: userId }
      const courses = await Course.find(query).sort({ createdAt: -1 }).lean()
      return apiSuccess(courses)
    }

    // Public: only published courses
    const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).lean()
    return apiSuccess(courses)
  } catch {
    return apiError('Failed to fetch courses', 500)
  }
}

// POST /api/courses — admin creates a course
export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)
    if (!(await isAdmin())) return apiError('Forbidden: Admin only', 403)

    const body = await request.json()
    const parsed = CreateCourseSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    await connectDB()
    const course = await Course.create({
      ...parsed.data,
      adminId: userId,
    })

    // Track in admin's createdCourses
    await User.findOneAndUpdate(
      { clerkId: userId },
      { $addToSet: { createdCourses: course._id } }
    )

    return apiSuccess(course, 201)
  } catch (err) {
    console.error('[POST /api/courses]', err)
    return apiError('Server error', 500)
  }
}

import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import { isAdmin, isCourseOwner } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { z } from 'zod'

const UpdateCourseSchema = z.object({
  title:       z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  thumbnail:   z.string().optional(),
  category:    z.string().optional(),
  level:       z.string().optional(),
  price:       z.number().min(0).optional(),
  isFree:      z.boolean().optional(),
  isPublished: z.boolean().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const course = await Course.findById(id).lean()
    if (!course) return apiError('Course not found', 404)
    const chapters = await Chapter.find({ courseId: id, isPublished: true })
      .sort({ order: 1 }).select('-videoUrl -cloudinaryPublicId').lean()
    return apiSuccess({ course, chapters })
  } catch {
    return apiError('Server error', 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)
    if (!(await isAdmin())) return apiError('Forbidden', 403)

    const { id } = await params

    // Ownership check — regular admins can only edit their own courses
    const ownsIt = await isCourseOwner(id, userId)
    if (!ownsIt) return apiError('Forbidden: not your course', 403)

    const body = await request.json()
    const parsed = UpdateCourseSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    await connectDB()
    const course = await Course.findByIdAndUpdate(id, parsed.data, { new: true })
    if (!course) return apiError('Course not found', 404)
    return apiSuccess(course)
  } catch {
    return apiError('Server error', 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)
    if (!(await isAdmin())) return apiError('Forbidden', 403)

    const { id } = await params

    const ownsIt = await isCourseOwner(id, userId)
    if (!ownsIt) return apiError('Forbidden: not your course', 403)

    await connectDB()
    await Course.findByIdAndDelete(id)
    await Chapter.deleteMany({ courseId: id })
    return apiSuccess({ message: 'Course deleted' })
  } catch {
    return apiError('Server error', 500)
  }
}

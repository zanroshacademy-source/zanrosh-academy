import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import { isAdmin, isCourseOwner } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { z } from 'zod'

const CreateChapterSchema = z.object({
  courseId:           z.string().min(1),
  title:              z.string().min(1).max(200),
  description:        z.string().optional().default(''),
  videoUrl:           z.string().optional().default(''),
  cloudinaryPublicId: z.string().optional().default(''),
  videoProvider:      z.enum(['cloudinary', 'external', '']).optional().default(''),
  duration:           z.number().optional().default(0),
  order:              z.number().int().min(0),
  price:              z.number().min(0).default(400),
  accessDays:         z.number().int().min(1).max(365).default(15),
  isFree:             z.boolean().default(false),
  isPublished:        z.boolean().default(false),
})

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)
    if (!(await isAdmin())) return apiError('Forbidden', 403)

    const body = await request.json()
    const parsed = CreateChapterSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    // Verify admin owns the course
    const ownsIt = await isCourseOwner(parsed.data.courseId, userId)
    if (!ownsIt) return apiError('Forbidden: not your course', 403)

    await connectDB()
    const chapter = await Chapter.create(parsed.data)
    return apiSuccess(chapter, 201)
  } catch (err) {
    console.error('[Chapter POST]', err)
    return apiError('Server error', 500)
  }
}

export async function GET() {
  try {
    await connectDB()
    const chapters = await Chapter.find({ isPublished: true }).sort({ createdAt: -1 }).lean()
    return apiSuccess(chapters)
  } catch {
    return apiError('Server error', 500)
  }
}

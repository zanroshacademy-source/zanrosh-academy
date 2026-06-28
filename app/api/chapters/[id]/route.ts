import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import { isAdmin, isCourseOwner } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)
    if (!(await isAdmin())) return apiError('Forbidden', 403)

    const { id } = await params
    const body = await request.json()

    await connectDB()
    const chapter = await Chapter.findById(id)
    if (!chapter) return apiError('Chapter not found', 404)

    const ownsIt = await isCourseOwner(chapter.courseId.toString(), userId)
    if (!ownsIt) return apiError('Forbidden', 403)

    Object.assign(chapter, body)
    await chapter.save()

    // Auto-publish the parent course when this unit is published
    if (body.isPublished === true) {
      await Course.findByIdAndUpdate(chapter.courseId, { isPublished: true })
    }

    return apiSuccess(chapter)
  } catch (err) {
    console.error('[Chapter PATCH]', err)
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
    await connectDB()
    const chapter = await Chapter.findById(id)
    if (!chapter) return apiError('Chapter not found', 404)

    const ownsIt = await isCourseOwner(chapter.courseId.toString(), userId)
    if (!ownsIt) return apiError('Forbidden', 403)

    await Chapter.findByIdAndDelete(id)

    return apiSuccess({ message: 'Chapter deleted' })
  } catch (err) {
    console.error('[Chapter DELETE]', err)
    return apiError('Server error', 500)
  }
}

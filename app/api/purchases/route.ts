import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Purchase from '@/models/Purchase'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET() {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    await connectDB()
    const purchases = await Purchase.find({ userId, status: 'approved' })
      .populate({
        path: 'chapterId',
        select: 'title description duration price courseId',
        populate: { path: 'courseId', select: 'title thumbnail slug' },
      })
      .sort({ createdAt: -1 })
      .lean()

    return apiSuccess(purchases)
  } catch {
    return apiError('Server error', 500)
  }
}

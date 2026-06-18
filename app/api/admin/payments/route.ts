import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Course from '@/models/Course'
import Chapter from '@/models/Chapter'
import { isAdmin, isSuperAdmin } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'

// GET /api/admin/payments
// Admin: only payments for chapters belonging to their courses
// Super admin: all payments
export async function GET() {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)
    if (!(await isAdmin())) return apiError('Forbidden', 403)

    await connectDB()

    const superAdmin = await isSuperAdmin()

    if (superAdmin) {
      const payments = await Payment.find()
        .populate('chapterId', 'title price courseId')
        .sort({ createdAt: -1 })
        .lean()
      return apiSuccess(payments)
    }

    // Regular admin: get their courses first
    const myCourses = await Course.find({ adminId: userId }).select('_id').lean()
    const myCourseIds = myCourses.map((c) => c._id)

    // Get chapters in those courses
    const myChapters = await Chapter.find({ courseId: { $in: myCourseIds } }).select('_id').lean()
    const myChapterIds = myChapters.map((c) => c._id)

    const payments = await Payment.find({ chapterId: { $in: myChapterIds } })
      .populate('chapterId', 'title price courseId')
      .sort({ createdAt: -1 })
      .lean()

    return apiSuccess(payments)
  } catch {
    return apiError('Server error', 500)
  }
}

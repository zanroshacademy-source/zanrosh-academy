import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import { apiError, apiSuccess } from '@/lib/utils'
import { z } from 'zod'

const InitiatePaymentSchema = z.object({
  type: z.enum(['course', 'chapter']),
  itemId: z.string().min(1),
  method: z.enum(['easypaisa', 'jazzcash']),
  transactionId: z.string().min(3).max(100),
  screenshotUrl: z.string().url('Invalid screenshot URL'),
})

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const body = await request.json()
    const parsed = InitiatePaymentSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    const { type, itemId, method, transactionId, screenshotUrl } = parsed.data

    await connectDB()
    
    let price = 0
    if (type === 'course') {
      const course = await Course.findById(itemId)
      if (!course) return apiError('Course not found', 404)
      if (!course.isPublished) return apiError('Course is not available', 403)
      price = course.price
    } else {
      const chapter = await Chapter.findById(itemId)
      if (!chapter) return apiError('Chapter not found', 404)
      if (!chapter.isPublished) return apiError('Chapter is not available', 403)
      price = chapter.price
    }

    const query = { userId, status: { $in: ['pending', 'approved'] } } as any
    if (type === 'course') query.courseId = itemId
    else query.chapterId = itemId

    const existingPurchase = await Purchase.findOne(query)
    
    if (existingPurchase) {
      if (existingPurchase.status === 'approved')
        return apiError('You already have access to this item', 409)
      return apiError('You already have a pending payment for this item', 409)
    }

    const paymentData = {
      userId, method, amount: price,
      transactionId, screenshotUrl, status: 'pending',
    } as any
    if (type === 'course') paymentData.courseId = itemId
    else paymentData.chapterId = itemId

    const payment = await Payment.create(paymentData)

    const purchaseData = {
      userId, paymentId: payment._id, status: 'pending',
    } as any
    if (type === 'course') purchaseData.courseId = itemId
    else purchaseData.chapterId = itemId

    await Purchase.create(purchaseData)

    return apiSuccess({
      paymentId: payment._id,
      status: 'pending',
      message: 'Payment submitted. Access unlocked once approved.',
    }, 201)
  } catch {
    return apiError('Server error', 500)
  }
}

export async function GET() {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    await connectDB()
    const payments = await Payment.find({ userId })
      .populate('chapterId', 'title price')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 })
      .lean()

    return apiSuccess(payments)
  } catch {
    return apiError('Server error', 500)
  }
}

import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Topic from '@/models/Topic'
import { isAdmin } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { z } from 'zod'
import { sendCourseUnlockedEmail } from '@/lib/mailer'

const ApproveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)
    if (!(await isAdmin())) return apiError('Forbidden: Admin only', 403)

    const { id } = await params
    const body = await request.json()
    const parsed = ApproveSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

    await connectDB()
    const payment = await Payment.findById(id)
    if (!payment) return apiError('Payment not found', 404)
    // Removed 409 check so admin can change status from rejected to approved if needed

    const { status, adminNote } = parsed.data
    payment.status = status
    if (adminNote) payment.adminNote = adminNote
    await payment.save()

    // When approving, calculate expiresAt based on what was purchased
    let expiresAt: Date | null = null
    if (status === 'approved') {
      if (payment.topicId) {
        // Topic-level purchase — use topic's accessDays or unit's accessDays
        const topic = await Topic.findById(payment.topicId).select('accessDays unitId').lean()
        let days = (topic as any)?.accessDays
        if (!days && (topic as any)?.unitId) {
          const unit = await Chapter.findById((topic as any).unitId).select('accessDays').lean()
          days = (unit as any)?.accessDays
        }
        days = days || 15
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      } else if (payment.chapterId) {
        // Unit-level purchase — use chapter's accessDays
        const unit = await Chapter.findById(payment.chapterId).select('accessDays').lean()
        const days = (unit as any)?.accessDays ?? 15
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      }
    }

    // Build the full purchase document so upsert can create it if it doesn't exist yet
    // (screenshot payments don't create a Purchase record at submission time — only Payment)
    const purchaseUpdate: Record<string, unknown> = { status }
    if (expiresAt) purchaseUpdate.expiresAt = expiresAt

    const purchaseFields: Record<string, unknown> = {
      userId: payment.userId,
      paymentId: payment._id,
    }
    if (payment.courseId)  purchaseFields.courseId  = payment.courseId
    if (payment.chapterId) purchaseFields.chapterId = payment.chapterId
    if ((payment as any).topicId)   purchaseFields.topicId   = (payment as any).topicId
    if (expiresAt)         purchaseFields.expiresAt = expiresAt

    await Purchase.findOneAndUpdate(
      { paymentId: payment._id },
      { $set: { ...purchaseFields, status } },
      { upsert: true, new: true }
    )

    // ── Send confirmation email to buyer ──────────────────────────────────────
    if (status === 'approved') {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(payment.userId)
        const userEmail = clerkUser.emailAddresses[0]?.emailAddress ?? ''
        const userName = clerkUser.firstName ?? undefined

        let itemTitle = 'Your purchase'
        const itemType: 'course' | 'chapter' | 'topic' = (payment as any).topicId ? 'topic' : payment.chapterId ? 'chapter' : 'course'
        if ((payment as any).topicId) {
          const tp = await Topic.findById((payment as any).topicId).select('title').lean()
          itemTitle = (tp as any)?.title ?? 'Topic'
        } else if (payment.chapterId) {
          const ch = await Chapter.findById(payment.chapterId).select('title').lean()
          itemTitle = (ch as any)?.title ?? 'Unit'
        } else if (payment.courseId) {
          const co = await Course.findById(payment.courseId).select('title').lean()
          itemTitle = (co as any)?.title ?? 'Course'
        }

        await sendCourseUnlockedEmail({
          to: userEmail,
          userName,
          itemTitle,
          price: payment.amount,
          itemType,
          expiresAt: expiresAt ?? null,
        })
      } catch (emailErr) {
        console.error('[Admin Approve] Email error (non-fatal):', emailErr)
      }
    }

    return apiSuccess({
      message: status === 'approved'
        ? `Payment approved. Student now has unit access${expiresAt ? ` until ${expiresAt.toLocaleDateString()}` : ''}.`
        : 'Payment rejected.',
      paymentId: id,
      status,
      expiresAt,
    })
  } catch {
    return apiError('Server error', 500)
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const { id } = await params
    await connectDB()
    const payment = await Payment.findById(id)
      .populate('chapterId', 'title price')
      .lean()

    if (!payment) return apiError('Payment not found', 404)

    const admin = await isAdmin()
    if (!admin && payment.userId !== userId) return apiError('Forbidden', 403)

    return apiSuccess(payment)
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
    await connectDB()
    const payment = await Payment.findByIdAndDelete(id)
    if (!payment) return apiError('Payment not found', 404)
    
    // Also delete the purchase associated with it
    await Purchase.findOneAndDelete({ paymentId: payment._id })

    return apiSuccess({ message: 'Payment deleted' })
  } catch {
    return apiError('Server error', 500)
  }
}

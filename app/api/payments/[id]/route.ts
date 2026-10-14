import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
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

    // When approving a unit purchase, set expiresAt based on the unit's accessDays
    let expiresAt: Date | null = null
    if (status === 'approved' && payment.chapterId) {
      const unit = await Chapter.findById(payment.chapterId).select('accessDays').lean()
      const days = (unit as any)?.accessDays ?? 15
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    }

    const purchaseUpdate: Record<string, unknown> = { status }
    if (expiresAt) purchaseUpdate.expiresAt = expiresAt

    await Purchase.findOneAndUpdate({ paymentId: payment._id }, purchaseUpdate)

    // ── Send confirmation email to buyer ──────────────────────────────────────
    if (status === 'approved') {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(payment.userId)
        const userEmail = clerkUser.emailAddresses[0]?.emailAddress ?? ''
        const userName = clerkUser.firstName ?? undefined

        let itemTitle = 'Your purchase'
        const itemType: 'course' | 'chapter' = payment.chapterId ? 'chapter' : 'course'
        if (payment.chapterId) {
          const ch = await Chapter.findById(payment.chapterId).select('title').lean()
          itemTitle = (ch as any)?.title ?? 'Unit'
        } else if (payment.courseId) {
          const co = await Course.findById(payment.courseId).select('title').lean()
          itemTitle = (co as any)?.title ?? 'Course'
        }

        if (userEmail) {
          await sendCourseUnlockedEmail({
            to: userEmail,
            userName,
            itemTitle,
            price: payment.amount,
            itemType,
            expiresAt: expiresAt ?? null,
          })
        }
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

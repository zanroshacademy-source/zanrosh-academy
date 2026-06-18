import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Purchase from '@/models/Purchase'
import { isAdmin } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'
import { z } from 'zod'

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

    await Purchase.findOneAndUpdate({ paymentId: payment._id }, { status })

    return apiSuccess({
      message: status === 'approved'
        ? 'Payment approved. Student now has chapter access.'
        : 'Payment rejected.',
      paymentId: id,
      status,
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

import mongoose, { Schema, Document, Model } from 'mongoose'
import type { PaymentStatus } from '@/lib/types'

export interface IPurchaseDocument extends Document {
  userId: string // clerkId
  courseId?: mongoose.Types.ObjectId
  chapterId?: mongoose.Types.ObjectId
  paymentId: mongoose.Types.ObjectId
  status: PaymentStatus
  createdAt: Date
  updatedAt: Date
}

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    userId: { type: String, required: true, index: true },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

// Removed unique index to allow students to retry payments if rejected.
// Application logic handles duplicate approved purchases.

if (mongoose.models.Purchase) {
  delete mongoose.models.Purchase
}

const Purchase: Model<IPurchaseDocument> = mongoose.model<IPurchaseDocument>('Purchase', PurchaseSchema)

export default Purchase

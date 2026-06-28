import mongoose, { Schema, Document, Model } from 'mongoose'
import type { PaymentStatus } from '@/lib/types'

export interface IPurchaseDocument extends Document {
  userId: string // clerkId
  courseId?: mongoose.Types.ObjectId
  chapterId?: mongoose.Types.ObjectId  // this is the Unit (Chapter) id
  paymentId: mongoose.Types.ObjectId
  status: PaymentStatus
  expiresAt?: Date  // set when approved — createdAt + accessDays
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
    // Set on approval: now + accessDays * 86400 seconds
    // Null for full-course purchases (they don't expire)
    expiresAt: { type: Date, default: null },
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

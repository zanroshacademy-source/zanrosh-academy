import mongoose, { Schema, Document, Model } from 'mongoose'
import type { PaymentMethod, PaymentStatus } from '@/lib/types'

export interface IPaymentDocument extends Document {
  userId: string // clerkId
  courseId?: mongoose.Types.ObjectId
  chapterId?: mongoose.Types.ObjectId
  method: PaymentMethod
  amount: number
  transactionId: string
  screenshotUrl: string
  status: PaymentStatus
  adminNote?: string
  // Future API integration fields
  safepayTrackerId?: string
  safepayReference?: string
  rapidGatewayBasketId?: string
  gatewayResponse?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPaymentDocument>(
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
    method: {
      type: String,
      enum: ['easypaisa', 'jazzcash', 'safepay', 'rapidgateway'],
      required: true,
    },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true, trim: true },
    screenshotUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String },
    safepayTrackerId: { type: String },
    safepayReference: { type: String },
    rapidGatewayBasketId: { type: String, index: true },
    gatewayResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
)

if (mongoose.models.Payment) {
  delete mongoose.models.Payment
}

const Payment: Model<IPaymentDocument> = mongoose.model<IPaymentDocument>('Payment', PaymentSchema)

export default Payment

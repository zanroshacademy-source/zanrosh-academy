import mongoose, { Schema, Document, Model } from 'mongoose'
import type { UserRole } from '@/lib/types'

export interface IUserDocument extends Document {
  clerkId: string
  email: string
  fullName: string
  role: UserRole
  purchasedCourses: mongoose.Types.ObjectId[]
  purchasedChapters: mongoose.Types.ObjectId[]
  createdCourses: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUserDocument>(
  {
    clerkId:  { type: String, required: true, unique: true, index: true },
    email:    { type: String, required: true, unique: true },
    fullName: { type: String, required: true, default: '' },
    role: {
      type: String,
      enum: ['student', 'admin', 'super_admin'],
      default: 'student',
    },
    purchasedCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    purchasedChapters: [{ type: Schema.Types.ObjectId, ref: 'Chapter' }],
    createdCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true }
)

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema)

export default User

// ─── Role System ──────────────────────────────────────────────────
export type UserRole = 'student' | 'admin' | 'super_admin'

export type PaymentMethod = 'easypaisa' | 'jazzcash'

export type PaymentStatus = 'pending' | 'approved' | 'rejected'

export type VideoProvider = 'cloudinary' | 'external'

// ─── MongoDB Interfaces ────────────────────────────────────────────
export interface IUser {
  _id: string
  clerkId: string
  email: string
  fullName: string
  role: UserRole
  purchasedCourses: string[]
  purchasedChapters: string[]
  createdCourses: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ICourse {
  _id: string
  title: string
  description: string
  thumbnail: string
  slug: string
  category: string
  level: string
  adminId: string          // clerkId of owning admin
  isPublished: boolean
  totalStudents: number
  totalRevenue: number
  createdAt: Date
  updatedAt: Date
}

export interface IChapter {
  _id: string
  courseId: string
  title: string
  description: string
  videoUrl: string         // Cloudinary public_id OR embed URL
  videoProvider: VideoProvider
  cloudinaryPublicId?: string
  duration: number         // seconds
  order: number
  price: number            // PKR
  isFree: boolean
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IPurchase {
  _id: string
  userId: string           // clerkId
  chapterId: string
  paymentId: string
  status: PaymentStatus
  createdAt: Date
  updatedAt: Date
}

export interface IPayment {
  _id: string
  userId: string           // clerkId
  chapterId: string
  courseId?: string        // optional, for course-level purchase
  method: PaymentMethod
  amount: number           // PKR
  transactionId: string
  screenshotUrl: string
  status: PaymentStatus
  adminNote?: string
  reviewedBy?: string      // admin clerkId who reviewed
  createdAt: Date
  updatedAt: Date
}

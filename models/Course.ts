import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICourseDocument extends Document {
  adminId: string
  title: string
  description: string
  thumbnail: string
  category: string
  level: string
  price: number
  isFree: boolean
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

const CourseSchema = new Schema<ICourseDocument>(
  {
    adminId:     { type: String, required: true, index: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    thumbnail:   { type: String, default: '' },
    category:    { type: String, default: 'General' },
    level:       { type: String, default: 'Beginner' },
    price:       { type: Number, default: 0 },
    isFree:      { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
)

if (mongoose.models.Course) {
  delete mongoose.models.Course
}

const Course: Model<ICourseDocument> = mongoose.model<ICourseDocument>('Course', CourseSchema)

export default Course

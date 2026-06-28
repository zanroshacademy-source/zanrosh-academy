import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IChapterDocument extends Document {
  courseId: mongoose.Types.ObjectId
  title: string
  description: string
  // Legacy video fields kept for backward compatibility (old units that have direct videos)
  videoUrl: string
  cloudinaryPublicId: string
  videoProvider: 'cloudinary' | 'external' | ''
  duration: number
  price: number
  order: number
  isFree: boolean
  isPublished: boolean
  // New fields for Unit model
  accessDays: number   // how many days access lasts after purchase (default 15)
  unitNumber: number   // display number shown to students
  createdAt: Date
  updatedAt: Date
}

const ChapterSchema = new Schema<IChapterDocument>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    // Legacy video fields — kept for backward compat with old chapters that have direct videos
    videoUrl:           { type: String, default: '' },
    cloudinaryPublicId: { type: String, default: '' },
    videoProvider:      { type: String, default: '' },
    duration:           { type: Number, default: 0 },
    price:              { type: Number, default: 400 },
    order:              { type: Number, required: true, default: 0 },
    isFree:             { type: Boolean, default: false },
    isPublished:        { type: Boolean, default: false },
    // Unit-specific fields
    accessDays:  { type: Number, default: 15, min: 1, max: 365 },
    unitNumber:  { type: Number, default: 0 },
  },
  { timestamps: true }
)

if (mongoose.models.Chapter) {
  delete mongoose.models.Chapter
}

const Chapter: Model<IChapterDocument> = mongoose.model<IChapterDocument>('Chapter', ChapterSchema)

export default Chapter

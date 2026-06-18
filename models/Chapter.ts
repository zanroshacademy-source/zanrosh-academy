import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IChapterDocument extends Document {
  courseId: mongoose.Types.ObjectId
  title: string
  description: string
  videoUrl: string
  cloudinaryPublicId: string
  videoProvider: 'cloudinary' | 'external' | ''
  duration: number
  price: number
  order: number
  isFree: boolean
  isPublished: boolean
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
    videoUrl:    { type: String, default: '' },
    cloudinaryPublicId: { type: String, default: '' },
    videoProvider: { type: String, default: '' },
    duration:    { type: Number, default: 0 },
    price:       { type: Number, default: 0 },
    order:       { type: Number, required: true, default: 0 },
    isFree:      { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
)

if (mongoose.models.Chapter) {
  delete mongoose.models.Chapter
}

const Chapter: Model<IChapterDocument> = mongoose.model<IChapterDocument>('Chapter', ChapterSchema)

export default Chapter

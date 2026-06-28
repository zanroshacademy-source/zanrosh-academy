import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITopicDocument extends Document {
  unitId: mongoose.Types.ObjectId   // refs Chapter (Unit)
  courseId: mongoose.Types.ObjectId // refs Course
  title: string
  description: string
  videoUrl: string
  cloudinaryPublicId: string
  videoProvider: 'cloudinary' | 'external' | ''
  duration: number   // seconds
  order: number      // 1–30
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

const TopicSchema = new Schema<ITopicDocument>(
  {
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title:              { type: String, required: true, trim: true },
    description:        { type: String, default: '' },
    videoUrl:           { type: String, default: '' },
    cloudinaryPublicId: { type: String, default: '' },
    videoProvider:      { type: String, default: '' },
    duration:           { type: Number, default: 0 },
    order:              { type: Number, required: true, default: 1 },
    isPublished:        { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Prevent duplicate orders within a unit
TopicSchema.index({ unitId: 1, order: 1 })

if (mongoose.models.Topic) {
  delete mongoose.models.Topic
}

const Topic: Model<ITopicDocument> = mongoose.model<ITopicDocument>('Topic', TopicSchema)

export default Topic

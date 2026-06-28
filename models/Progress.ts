import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProgressDocument extends Document {
  userId: string                       // clerkId
  topicId: mongoose.Types.ObjectId     // refs Topic
  unitId: mongoose.Types.ObjectId      // refs Chapter (Unit)
  courseId: mongoose.Types.ObjectId    // refs Course
  currentTime: number                  // seconds — last watch position
  duration: number                     // seconds — total video length
  percentCompleted: number             // 0–100
  lastWatchedAt: Date
  createdAt: Date
  updatedAt: Date
}

const ProgressSchema = new Schema<IProgressDocument>(
  {
    userId:   { type: String, required: true, index: true },
    topicId:  { type: Schema.Types.ObjectId, ref: 'Topic',   required: true },
    unitId:   { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course',  required: true },
    currentTime:      { type: Number, default: 0 },
    duration:         { type: Number, default: 0 },
    percentCompleted: { type: Number, default: 0, min: 0, max: 100 },
    lastWatchedAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// One progress record per user per topic
ProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true })

if (mongoose.models.Progress) {
  delete mongoose.models.Progress
}

const Progress: Model<IProgressDocument> = mongoose.model<IProgressDocument>('Progress', ProgressSchema)

export default Progress

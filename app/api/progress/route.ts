import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Progress from '@/models/Progress'
import { auth } from '@clerk/nextjs/server'

// GET /api/progress?topicId=xxx  — get progress for a specific topic
// GET /api/progress?unitId=xxx   — get all progress for a unit
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session.userId
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const topicId = req.nextUrl.searchParams.get('topicId')
    const unitId = req.nextUrl.searchParams.get('unitId')

    if (topicId) {
      const progress = await Progress.findOne({ userId, topicId }).lean()
      return NextResponse.json({ progress: progress ?? null })
    }

    if (unitId) {
      const progressList = await Progress.find({ userId, unitId }).lean()
      return NextResponse.json({ progress: progressList })
    }

    return NextResponse.json({ error: 'topicId or unitId required' }, { status: 400 })
  } catch (err) {
    console.error('[GET /api/progress]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/progress  — upsert progress for a topic
// Body: { topicId, unitId, courseId, currentTime, duration }
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session.userId
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { topicId, unitId, courseId, currentTime, duration } = body

    if (!topicId || !unitId || !courseId) {
      return NextResponse.json({ error: 'topicId, unitId, courseId required' }, { status: 400 })
    }

    const ct = Math.max(0, Number(currentTime) || 0)
    const dur = Math.max(0, Number(duration) || 0)
    const pct = dur > 0 ? Math.min(100, Math.round((ct / dur) * 100)) : 0

    await connectDB()

    const progress = await Progress.findOneAndUpdate(
      { userId, topicId },
      {
        $set: {
          unitId,
          courseId,
          currentTime: ct,
          duration: dur,
          percentCompleted: pct,
          lastWatchedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ progress })
  } catch (err) {
    console.error('[POST /api/progress]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

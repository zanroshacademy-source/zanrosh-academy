import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Topic from '@/models/Topic'
import Chapter from '@/models/Chapter'
import { getServerAuth } from '@/lib/server-auth'

// GET /api/topics?unitId=xxx  — list all topics for a unit
export async function GET(req: NextRequest) {
  try {
    const unitId = req.nextUrl.searchParams.get('unitId')
    if (!unitId) return NextResponse.json({ error: 'unitId required' }, { status: 400 })

    await connectDB()
    const topics = await Topic.find({ unitId }).sort({ order: 1 }).lean()
    return NextResponse.json({ topics })
  } catch (err) {
    console.error('[GET /api/topics]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/topics  — create a new topic inside a unit
export async function POST(req: NextRequest) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { unitId, courseId, title, description, videoUrl, cloudinaryPublicId, videoProvider, duration, order, isPublished } = body

    if (!unitId || !courseId || !title) {
      return NextResponse.json({ error: 'unitId, courseId and title are required' }, { status: 400 })
    }

    await connectDB()

    // Verify the unit exists and belongs to this admin (or user is super_admin)
    const unit = await Chapter.findById(unitId).lean()
    if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 })

    // Enforce max 30 topics per unit
    const existingCount = await Topic.countDocuments({ unitId })
    if (existingCount >= 30) {
      return NextResponse.json({ error: 'Maximum 30 topics per unit' }, { status: 400 })
    }

    // Default order to next available if not provided
    const topicOrder = order ?? existingCount + 1

    const topic = await Topic.create({
      unitId,
      courseId,
      title: title.trim(),
      description: description ?? '',
      videoUrl: videoUrl ?? '',
      cloudinaryPublicId: cloudinaryPublicId ?? '',
      videoProvider: videoProvider ?? '',
      duration: duration ?? 0,
      order: topicOrder,
      isPublished: isPublished ?? false,
    })

    return NextResponse.json({ topic }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/topics]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

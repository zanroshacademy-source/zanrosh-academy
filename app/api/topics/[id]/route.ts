import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Topic from '@/models/Topic'
import { getServerAuth } from '@/lib/server-auth'

// GET /api/topics/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()
    const topic = await Topic.findById(id).lean()
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    return NextResponse.json({ topic })
  } catch (err) {
    console.error('[GET /api/topics/[id]]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/topics/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    await connectDB()

    const allowed = ['title', 'description', 'videoUrl', 'cloudinaryPublicId', 'videoProvider', 'duration', 'order', 'isPublished']
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    const topic = await Topic.findByIdAndUpdate(id, { $set: update }, { new: true })
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

    return NextResponse.json({ topic })
  } catch (err) {
    console.error('[PATCH /api/topics/[id]]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/topics/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const topic = await Topic.findByIdAndDelete(id)
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/topics/[id]]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

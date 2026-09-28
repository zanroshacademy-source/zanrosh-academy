import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import { apiError, apiSuccess } from '@/lib/utils'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const formData   = await request.formData()
    const file       = formData.get('screenshot') as File | null
    const itemId     = formData.get('itemId') as string
    const itemType   = formData.get('itemType') as 'course' | 'chapter'
    const txId       = (formData.get('transactionId') as string) || ''
    const methodName = (formData.get('method') as string) || 'easypaisa_screenshot'

    if (!file || !itemId || !itemType) return apiError('Missing required fields', 422)
    if (!['course', 'chapter'].includes(itemType)) return apiError('Invalid itemType', 422)

    await connectDB()

    // Get item price
    let price = 0
    if (itemType === 'course') {
      const course = await Course.findById(itemId)
      if (!course || !course.isPublished) return apiError('Course not found', 404)
      price = course.price
    } else {
      const chapter = await Chapter.findById(itemId)
      if (!chapter || !chapter.isPublished) return apiError('Chapter not found', 404)
      price = chapter.price
    }

    // Upload screenshot to Cloudinary
    const arrayBuf = await file.arrayBuffer()
    const base64   = Buffer.from(arrayBuf).toString('base64')
    const mime     = file.type || 'image/jpeg'
    const dataUri  = `data:${mime};base64,${base64}`

    const uploadRes = await cloudinary.uploader.upload(dataUri, {
      folder: 'easypaisa-screenshots',
      resource_type: 'image',
    })

    // Clean up old pending screenshot payments for this user+item
    const oldQ: any = { userId, method: methodName, status: 'pending' }
    if (itemType === 'course') oldQ.courseId = itemId
    else oldQ.chapterId = itemId
    await Payment.deleteMany(oldQ)

    // Create pending payment with screenshot
    const payData: any = {
      userId,
      method:        methodName,
      amount:        price,
      transactionId: txId || `SCREENSHOT-${Date.now()}`,
      screenshotUrl: uploadRes.secure_url,
      status:        'pending',
    }
    if (itemType === 'course') payData.courseId = itemId
    else payData.chapterId = itemId
    await Payment.create(payData)

    return apiSuccess({ message: 'Screenshot submitted successfully! Admin will review and approve shortly.' })
  } catch (err: any) {
    console.error('[Screenshot Upload] Error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

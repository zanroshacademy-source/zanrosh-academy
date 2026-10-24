import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Topic from '@/models/Topic'
import { apiError, apiSuccess } from '@/lib/utils'
import { sendPaymentRequestEmail } from '@/lib/mailer'

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dsirwhspw'
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '624353246995188'
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '5OZqxBqV8HcCZXaLmuCDyymF0iI'

export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const formData   = await request.formData()
    const file       = formData.get('screenshot') as File | null
    const itemId     = formData.get('itemId') as string
    const itemType   = formData.get('itemType') as 'course' | 'chapter' | 'topic'
    const txId       = (formData.get('transactionId') as string) || ''
    const reqMethod  = (formData.get('method') as string) || 'easypaisa'
    const submittedEmail = (formData.get('userEmail') as string) || (formData.get('email') as string) || ''
    const methodName = 'easypaisa'

    if (!file || !itemId || !itemType) return apiError('Missing required fields', 422)
    if (!['course', 'chapter', 'topic'].includes(itemType)) return apiError('Invalid itemType', 422)

    await connectDB()

    // Get item price and title
    let price = 0
    let itemTitle = 'Topic'
    if (itemType === 'topic') {
      const topic = await Topic.findById(itemId)
      if (!topic || !topic.isPublished) return apiError('Topic not found', 404)
      const unit = await Chapter.findById(topic.unitId)
      price = (topic.price !== undefined && topic.price !== null && topic.price > 0) ? topic.price : (unit?.price || 0)
      itemTitle = topic.title || 'Topic'
    } else if (itemType === 'course') {
      const course = await Course.findById(itemId)
      if (!course || !course.isPublished) return apiError('Course not found', 404)
      price = course.price
      itemTitle = course.title || 'Course'
    } else {
      const chapter = await Chapter.findById(itemId)
      if (!chapter || !chapter.isPublished) return apiError('Chapter not found', 404)
      price = chapter.price
      itemTitle = chapter.title || 'Unit'
    }

    // Upload screenshot to Cloudinary
    let imageUrl = ''
    try {
      const cloudinary = (await import('cloudinary')).v2
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key:    CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
      })

      const arrayBuf = await file.arrayBuffer()
      const base64   = Buffer.from(arrayBuf).toString('base64')
      const mime     = file.type || 'image/jpeg'
      const dataUri  = `data:${mime};base64,${base64}`

      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        folder: 'zanrosh-academy/screenshots',
      })
      imageUrl = uploadRes.secure_url
    } catch (uploadErr) {
      console.error('[Cloudinary Screenshot Upload Error]:', uploadErr)
      return apiError('Failed to upload screenshot to image server. Please try again.', 500)
    }

    // Clean up old pending screenshot payments for this user+item
    const oldQ: any = { userId, method: methodName, status: 'pending' }
    if (itemType === 'course') oldQ.courseId = itemId
    else if (itemType === 'chapter') oldQ.chapterId = itemId
    else oldQ.topicId = itemId
    await Payment.deleteMany(oldQ)

    // Get student details
    let userEmail = submittedEmail
    let userName = ''
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      if (!userEmail) userEmail = clerkUser.emailAddresses[0]?.emailAddress ?? ''
      userName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || ''
    } catch (e) {
      console.warn('[Screenshot] Could not fetch clerk user:', e)
    }

    // Create pending payment with screenshot
    const payData: any = {
      userId,
      userEmail,
      userName,
      method:        methodName,
      amount:        price,
      transactionId: txId || `SCREENSHOT-${Date.now()}`,
      screenshotUrl: imageUrl,
      status:        'pending',
    }
    if (itemType === 'course') {
      payData.courseId = itemId
    } else if (itemType === 'chapter') {
      payData.chapterId = itemId
    } else {
      payData.topicId = itemId
      if (topic) {
        payData.chapterId = topic.unitId
        payData.courseId = topic.courseId
      }
    }
    await Payment.create(payData)

    // Notify zanroshacademy@gmail.com to accept the payment
    const methodDisplay = reqMethod.includes('qr')
      ? 'Easypaisa (QR Code Payment)'
      : 'Easypaisa (Screenshot / Transfer)'

    try {
      await sendPaymentRequestEmail({
        userName: userName || undefined,
        userEmail: userEmail || undefined,
        itemTitle,
        price,
        itemType,
        method: methodDisplay,
        transactionId: txId || undefined,
        screenshotUrl: imageUrl,
      })
    } catch (emailErr) {
      console.error('[Screenshot Email Error]:', emailErr)
    }

    return apiSuccess({ message: 'You will get access in 24 hours for this course.' })
  } catch (err: any) {
    console.error('[Screenshot Upload] Error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

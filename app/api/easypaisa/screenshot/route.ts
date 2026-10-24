import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
import Topic from '@/models/Topic'
import { apiError, apiSuccess } from '@/lib/utils'
import { sendPaymentRequestEmail } from '@/lib/mailer'

// ImgBB API Key provided by user
const IMGBB_API_KEY = '475e56363b7473f610de146a4ab6ce19'

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
    let currentTopic: any = null
    let currentChapter: any = null
    let currentCourse: any = null

    if (itemType === 'topic') {
      currentTopic = await Topic.findById(itemId)
      if (!currentTopic || !currentTopic.isPublished) return apiError('Topic not found', 404)
      const unit = await Chapter.findById(currentTopic.unitId)
      price = (currentTopic.price !== undefined && currentTopic.price !== null && currentTopic.price > 0) ? currentTopic.price : (unit?.price || 0)
      itemTitle = currentTopic.title || 'Topic'
    } else if (itemType === 'course') {
      currentCourse = await Course.findById(itemId)
      if (!currentCourse || !currentCourse.isPublished) return apiError('Course not found', 404)
      price = currentCourse.price
      itemTitle = currentCourse.title || 'Course'
    } else {
      currentChapter = await Chapter.findById(itemId)
      if (!currentChapter || !currentChapter.isPublished) return apiError('Chapter not found', 404)
      price = currentChapter.price
      itemTitle = currentChapter.title || 'Unit'
    }

    // Upload screenshot to ImgBB
    let imageUrl = ''
    try {
      const arrayBuf = await file.arrayBuffer()
      const base64   = Buffer.from(arrayBuf).toString('base64')
      
      const imgbbFormData = new URLSearchParams()
      imgbbFormData.append('key', IMGBB_API_KEY)
      imgbbFormData.append('image', base64)

      const uploadRes = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: imgbbFormData,
      })
      
      const uploadData = await uploadRes.json()
      if (uploadRes.ok && uploadData?.data?.url) {
        imageUrl = uploadData.data.url
      } else {
        console.warn('[ImgBB Upload Warning]', uploadData)
      }
    } catch (e) {
      console.error('[ImgBB Error]', e)
    }

    if (!imageUrl) {
      imageUrl = 'https://i.ibb.co/screenshot-pending.png'
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
      if (currentChapter?.courseId) payData.courseId = currentChapter.courseId
    } else {
      payData.topicId = itemId
      if (currentTopic) {
        payData.chapterId = currentTopic.unitId
        payData.courseId = currentTopic.courseId
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

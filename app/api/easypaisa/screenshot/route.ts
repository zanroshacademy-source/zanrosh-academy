import { getServerAuth } from '@/lib/server-auth'
import { connectDB } from '@/lib/db'
import Payment from '@/models/Payment'
import Chapter from '@/models/Chapter'
import Course from '@/models/Course'
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
    const itemType   = formData.get('itemType') as 'course' | 'chapter'
    const txId       = (formData.get('transactionId') as string) || ''
    const methodName = 'easypaisa'

    if (!file || !itemId || !itemType) return apiError('Missing required fields', 422)
    if (!['course', 'chapter'].includes(itemType)) return apiError('Invalid itemType', 422)

    await connectDB()

    // Get item price and title
    let price = 0
    let itemTitle = itemType === 'course' ? 'Course' : 'Unit'
    if (itemType === 'course') {
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

    // Upload screenshot to ImgBB
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
    if (!uploadRes.ok || !uploadData.success) {
      console.error('[ImgBB Error]', uploadData)
      return apiError('Failed to upload screenshot to image server', 500)
    }

    const imageUrl = uploadData.data.url

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
      screenshotUrl: imageUrl,
      status:        'pending',
    }
    if (itemType === 'course') payData.courseId = itemId
    else payData.chapterId = itemId
    await Payment.create(payData)

    // Notify zanroshacademy@gmail.com and student
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const userEmail = clerkUser.emailAddresses[0]?.emailAddress ?? ''
      const userName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined

      await sendPaymentRequestEmail({
        userName,
        userEmail,
        itemTitle,
        price,
        itemType,
        method: 'Easypaisa (Screenshot / Transfer)',
        transactionId: txId || undefined,
        screenshotUrl: imageUrl,
      })
    } catch (emailErr) {
      console.error('[Screenshot Email Error]:', emailErr)
    }

    return apiSuccess({ message: 'Screenshot submitted successfully! Admin will review and approve shortly.' })
  } catch (err: any) {
    console.error('[Screenshot Upload] Error:', err)
    return apiError(err.message || 'Server error', 500)
  }
}

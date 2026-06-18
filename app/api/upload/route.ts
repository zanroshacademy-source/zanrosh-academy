import { getServerAuth } from '@/lib/server-auth'
import { apiError, apiSuccess } from '@/lib/utils'
import crypto from 'crypto'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!
const API_KEY    = process.env.CLOUDINARY_API_KEY!
const API_SECRET = process.env.CLOUDINARY_API_SECRET!

/**
 * POST /api/upload
 * Body: { folder: string, resource_type?: 'video' | 'image' }
 * Returns: { signature, timestamp, cloudName, apiKey, folder }
 * Client uses these to upload directly to Cloudinary.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getServerAuth()
    if (!userId) return apiError('Unauthorized', 401)

    const body = await request.json()
    const folder: string = body.folder || 'maqbool-academy'
    const resourceType: string = body.resource_type || 'image'

    const timestamp = Math.round(Date.now() / 1000)

    const deliveryType = resourceType === 'video' ? 'authenticated' : 'upload'

    // Build the string to sign (parameters must be alphabetical: folder, timestamp, type)
    let toSign = `folder=${folder}&timestamp=${timestamp}`
    if (deliveryType === 'authenticated') {
      toSign += `&type=authenticated`
    }
    toSign += API_SECRET

    const signature = crypto.createHash('sha256').update(toSign).digest('hex')

    return apiSuccess({
      signature,
      timestamp,
      cloudName: CLOUD_NAME,
      apiKey: API_KEY,
      folder,
      resourceType,
      type: deliveryType
    })
  } catch {
    return apiError('Failed to generate upload signature', 500)
  }
}

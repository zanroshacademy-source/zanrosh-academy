import { connectDB } from './lib/db'
import Chapter from './models/Chapter'
import cloudinary from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

async function test() {
  await connectDB()
  const chapter = await Chapter.findOne({ videoProvider: 'cloudinary' }).sort({ _id: -1 })
  if (!chapter) {
    console.log('No cloudinary chapter found')
    process.exit(0)
  }

  console.log('Original URL:', chapter.videoUrl)
  const matches = chapter.videoUrl.match(/\/(?:upload|authenticated)\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/)
  if (!matches) {
    console.log('Regex failed to match!')
    process.exit(1)
  }

  const publicId = matches[1]
  console.log('Public ID:', publicId)

  const hlsUrl = cloudinary.v2.url(publicId, {
    resource_type: 'video',
    type: 'authenticated', 
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 600,
    format: 'm3u8',
    streaming_profile: 'auto'
  })

  const mp4Url = cloudinary.v2.url(publicId, {
    resource_type: 'video',
    type: 'authenticated', 
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 600,
    format: 'mp4'
  })

  console.log('\nHLS URL:', hlsUrl)
  console.log('MP4 URL:', mp4Url)

  // Test fetching MP4 URL
  try {
    const res = await fetch(mp4Url, { method: 'HEAD' })
    console.log('\nMP4 URL Status:', res.status, res.statusText)
  } catch (e) {
    console.log('Fetch MP4 error:', e)
  }

  // Test fetching HLS URL
  try {
    const res = await fetch(hlsUrl, { method: 'HEAD' })
    console.log('HLS URL Status:', res.status, res.statusText)
  } catch (e) {
    console.log('Fetch HLS error:', e)
  }

  process.exit(0)
}

test()

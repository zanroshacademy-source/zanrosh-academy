const fs = require('fs')
const envData = fs.readFileSync('.env.local', 'utf8')
const env = {}
envData.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) env[match[1]] = match[2].trim().replace(/['"]/g, '')
})

const cloudinary = require('cloudinary').v2
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
})

const videoSrc = 'https://res.cloudinary.com/dsirwhspw/video/upload/v1714414068/maqbool-academy/chapters/xyz.mp4'
const matches = videoSrc.match(/\/(?:upload|authenticated)\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/)

if (matches && matches[1]) {
  const publicId = matches[1]
  
  const mp4Url = cloudinary.url(publicId, {
    resource_type: 'video',
    type: 'authenticated', 
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 600,
    format: 'mp4'
  })
  
  console.log('Testing MP4 URL:', mp4Url)
  
  fetch(mp4Url, { method: 'HEAD' })
    .then(res => console.log('MP4 URL Status:', res.status, res.statusText))
    .catch(e => console.log('Fetch error:', e))
}

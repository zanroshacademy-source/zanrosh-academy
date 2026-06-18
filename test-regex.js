const videoSrc1 = 'https://res.cloudinary.com/dsirwhspw/video/upload/v1714414068/maqbool-academy/chapters/xyz.mp4'
const videoSrc2 = 'https://res.cloudinary.com/dsirwhspw/video/upload/maqbool-academy/chapters/xyz.mp4'

const regex = /\/v\d+\/(.+)\.[a-zA-Z0-9]+$/
const regex2 = /\/(?:v\d+\/)?([^\/]+(?:\/[^\/]+)*)\.[a-zA-Z0-9]+$/

console.log('regex1 src1:', videoSrc1.match(regex)?.[1])
console.log('regex1 src2:', videoSrc2.match(regex)?.[1])

console.log('regex2 src1:', videoSrc1.match(regex2)?.[1])
console.log('regex2 src2:', videoSrc2.match(regex2)?.[1])

// Let's also test a regex that matches everything after /upload/ or /authenticated/
const regex3 = /\/(?:upload|authenticated)\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/
console.log('regex3 src1:', videoSrc1.match(regex3)?.[1])
console.log('regex3 src2:', videoSrc2.match(regex3)?.[1])

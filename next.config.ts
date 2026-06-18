import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ── Tell webpack NOT to bundle these server-only Node.js packages ──
  // Mongoose & MongoDB use native Node modules (net, tls, dns, fs) that
  // cannot run in the browser/webpack bundle. Marking them external
  // makes Next.js require() them at runtime on the server only.
  serverExternalPackages: ['mongoose', 'mongodb'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'ibb.co' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      // Cloudinary image delivery
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Video delivery (Cloudfront CDN)
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  async redirects() {
    return [
      {
        source: '/course',
        destination: '/courses',
        permanent: true,
      },
    ]
  },
}

export default nextConfig

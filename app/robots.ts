import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zanroshacademy.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/super-admin', '/dashboard', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    // Optimized for: physics classess in quetta, quetta classsess, physics classes Quetta
  }
}

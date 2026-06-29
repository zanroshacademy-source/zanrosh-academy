import type { Metadata } from 'next'
import './globals.css'

// ── Conditional Clerk import ─────────────────────────────────────
// In dev mode we skip ClerkProvider entirely to avoid key validation errors.
const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export const metadata: Metadata = {
  title: 'Zanrosh Academy — Physics Classes in Quetta & Online Learning',
  description:
    'Learn from expert instructors. Buy individual chapters and unlock knowledge at your own pace. Best physics classes in Quetta.',
  keywords: 'physics classess in quetta, quetta classsess, physics classes Quetta, online courses, Pakistan, Easypaisa, JazzCash, learning platform, Zanrosh Academy',
  verification: {
    google: 'yZLpWsFfdrW9kRgt2SYRHJV-kUoV7QVom-UH566uDdo',
  },
}

async function getProvider() {
  if (IS_DEV_MODE) {
    // Return a passthrough wrapper — no Clerk at all
    return ({ children }: { children: React.ReactNode }) => <>{children}</>
  }
  const { ClerkProvider } = await import('@clerk/nextjs')
  return ClerkProvider
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const Provider = await getProvider()

  return (
    <Provider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body>
          {children}
        </body>
      </html>
    </Provider>
  )
}

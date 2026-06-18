// ─── Dev Mode Flag ────────────────────────────────────────────────
// Set NEXT_PUBLIC_DEV_MODE=true in .env.local to bypass Clerk entirely.
// IMPORTANT: Always set to false before deploying to production.
export const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock user returned in dev mode (acts as admin so you can test all features)
export const DEV_USER = {
  id: 'dev_user_admin',
  userId: 'dev_user_admin',
  firstName: 'Dev',
  lastName: 'Admin',
  fullName: 'Dev Admin',
  emailAddresses: [{ emailAddress: 'dev@maqbool.local' }],
  // Helpers used by auth
  clerkId: 'dev_user_admin',
  role: 'admin' as const,
}

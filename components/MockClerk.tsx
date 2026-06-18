'use client'

/**
 * Mock Clerk components — used when NEXT_PUBLIC_DEV_MODE=true.
 * These are drop-in replacements so the UI renders without real Clerk keys.
 */

import { GraduationCap } from 'lucide-react'

// Always renders children (user is always "signed in" in dev mode)
export function SignedIn({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// Never renders children (user is never "signed out" in dev mode)
export function SignedOut({ _children }: { _children?: React.ReactNode }) {
  return null
}

// Avatar button placeholder
export function UserButton({ afterSignOutUrl: _ }: { afterSignOutUrl?: string }) {
  return (
    <div
      title="Dev Mode — Mock Admin"
      style={{
        width: 34, height: 34, borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'default', flexShrink: 0,
      }}
    >
      <GraduationCap size={18} color="white" />
    </div>
  )
}

// Sign-in page mock
export function SignIn() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '1rem', padding: '2.5rem', maxWidth: 400, width: '100%', textAlign: 'center',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔓</div>
      <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Dev Mode Active</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Clerk is bypassed. You are automatically signed in as a mock admin.
      </p>
      <a href="/dashboard" className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
        Go to Dashboard →
      </a>
    </div>
  )
}

// Sign-up page mock
export function SignUp() {
  return <SignIn />
}

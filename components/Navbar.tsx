'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, Crown, GraduationCap, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth, UserButton } from '@clerk/nextjs'

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const { isSignedIn, isLoaded } = useAuth()

  // Fetch role from /api/me — only after user is confirmed signed in
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setRole(null); return }

    fetch('/api/me')
      .then(r => r.json())
      .then(d => setRole(d.role ?? null))
      .catch(() => setRole(null))
  }, [isSignedIn, isLoaded])

  const isSuperAdmin = role === 'super_admin'

  const linkCls = (path: string) => {
    const active = pathname.startsWith(path)
    return `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
      active ? 'bg-[#27187e]/10 text-[#27187e]' : 'text-[#4A5043] hover:bg-[#27187e]/5 hover:text-[#27187e]'
    }`
  }

  return (
    <nav className="navbar relative">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0" style={{ textDecoration: 'none' }}>
        <div style={{ width: 36, height: 36, borderRadius: '0.625rem', background: '#27187e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap size={20} color="white" />
        </div>
        <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#27187e', letterSpacing: '-0.02em' }}>
          Zanrosh <span style={{ color: '#4A5043' }}>Academy</span>
        </span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-1">
        <Link href="/courses" className={linkCls('/courses')}>
          <BookOpen size={15} /> Courses
        </Link>

        {/* Only show these when signed in */}
        {isSignedIn && (
          <Link href="/dashboard" className={linkCls('/dashboard')}>
            <LayoutDashboard size={15} /> Dashboard
          </Link>
        )}

        {isSignedIn && isSuperAdmin && (
          <Link href="/super-admin" className={linkCls('/super-admin')}>
            <Crown size={15} /> Super Admin
          </Link>
        )}
      </div>

      {/* Auth Actions */}
      <div className="flex items-center gap-3">
        {/* Not signed in */}
        {isLoaded && !isSignedIn && (
          <>
            <Link href="/sign-in" className="btn-secondary hidden sm:inline-flex" style={{ padding: '0.5rem 1.125rem', fontSize: '0.875rem' }}>
              Sign In
            </Link>
            <Link href="/sign-up" className="btn-primary" style={{ padding: '0.5rem 1.125rem', fontSize: '0.875rem' }}>
              Get Started
            </Link>
          </>
        )}

        {/* Signed in: show avatar */}
        {isLoaded && isSignedIn && (
          <UserButton />
        )}

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen
            ? <X size={22} style={{ color: '#27187e' }} />
            : <Menu size={22} style={{ color: '#27187e' }} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(39,24,126,0.1)',
          boxShadow: '0 8px 32px rgba(39,24,126,0.1)',
          zIndex: 50, padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
        }}>
          <Link href="/courses" className={linkCls('/courses')} onClick={() => setMobileOpen(false)}>
            <BookOpen size={15} /> Courses
          </Link>

          {isSignedIn && (
            <>
              <Link href="/dashboard" className={linkCls('/dashboard')} onClick={() => setMobileOpen(false)}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              {isSuperAdmin && (
                <Link href="/super-admin" className={linkCls('/super-admin')} onClick={() => setMobileOpen(false)}>
                  <Crown size={15} /> Super Admin
                </Link>
              )}
            </>
          )}

          {!isSignedIn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(39,24,126,0.08)' }}>
              <Link href="/sign-in" className="btn-secondary" style={{ textAlign: 'center' }} onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link href="/sign-up" className="btn-primary" style={{ textAlign: 'center' }} onClick={() => setMobileOpen(false)}>Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

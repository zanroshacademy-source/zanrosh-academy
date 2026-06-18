'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, Shield, Crown, GraduationCap, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth, UserButton } from '@clerk/nextjs'

interface NavbarClientProps {
  role: string | null
}

export default function NavbarClient({ role }: NavbarClientProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isSignedIn } = useAuth()
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isSuperAdmin = role === 'super_admin'

  const linkClass = (path: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
      pathname.startsWith(path)
        ? 'bg-[#27187e]/10 text-[#27187e]'
        : 'text-[#4A5043] hover:bg-[#27187e]/5 hover:text-[#27187e]'
    }`

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 text-decoration-none shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#27187e] flex items-center justify-center shadow-sm">
          <GraduationCap size={20} color="white" />
        </div>
        <span className="font-black text-lg text-[#27187e] tracking-tight">
          Zanrosh <span className="text-[#4A5043]">Academy</span>
        </span>
      </Link>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-1">
        <Link href="/courses" className={linkClass('/courses')}>
          <BookOpen size={15} /> Courses
        </Link>

        {isSignedIn && (
          <>
            <Link href="/dashboard" className={linkClass('/dashboard')}>
              <LayoutDashboard size={15} /> Dashboard
            </Link>

            {/* Only show Admin link if user is admin or super_admin */}
            {isAdmin && (
              <Link href="/admin" className={linkClass('/admin')}>
                <Shield size={15} /> Admin
              </Link>
            )}

            {isSuperAdmin && (
              <Link href="/super-admin" className={linkClass('/super-admin')}>
                <Crown size={15} /> Super Admin
              </Link>
            )}
          </>
        )}
      </div>

      {/* Auth Actions */}
      <div className="flex items-center gap-3">
        {!isSignedIn && (
          <>
            <Link href="/sign-in" className="btn-secondary" style={{ padding: '0.5rem 1.125rem', fontSize: '0.875rem' }}>
              Sign In
            </Link>
            <Link href="/sign-up" className="btn-primary" style={{ padding: '0.5rem 1.125rem', fontSize: '0.875rem' }}>
              Get Started
            </Link>
          </>
        )}
        {isSignedIn && <UserButton />}

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-[#27187e]/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} className="text-[#27187e]" /> : <Menu size={20} className="text-[#27187e]" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-[#27187e]/10 shadow-xl z-50 px-4 py-4 flex flex-col gap-1">
          <Link href="/courses" className={linkClass('/courses')} onClick={() => setMobileOpen(false)}>
            <BookOpen size={15} /> Courses
          </Link>
          {isSignedIn && (
            <>
              <Link href="/dashboard" className={linkClass('/dashboard')} onClick={() => setMobileOpen(false)}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className={linkClass('/admin')} onClick={() => setMobileOpen(false)}>
                  <Shield size={15} /> Admin
                </Link>
              )}
              {isSuperAdmin && (
                <Link href="/super-admin" className={linkClass('/super-admin')} onClick={() => setMobileOpen(false)}>
                  <Crown size={15} /> Super Admin
                </Link>
              )}
            </>
          )}
          {!isSignedIn && (
            <>
              <Link href="/sign-in" className="btn-secondary mt-2" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link href="/sign-up" className="btn-primary mt-1" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

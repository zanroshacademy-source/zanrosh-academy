'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { LayoutDashboard } from 'lucide-react'

export default function HomeNavbar() {
  const { isSignedIn, isLoaded } = useAuth()

  return (
    <nav className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between border border-white/20 shadow-md">
      {/* Left: Logo */}
      <Link href="/" className="text-2xl font-bold tracking-tight text-[#27187e]">
        Zanrosh
      </Link>

      {/* Center: Links */}
      <div className="hidden md:flex items-center gap-8 text-sm text-[#27187e] font-semibold">
        <Link href="/courses" className="hover:text-[#4A5043] transition-colors">Courses</Link>
        <Link href="/about" className="hover:text-[#4A5043] transition-colors">About</Link>
        <Link href="/contact" className="hover:text-[#4A5043] transition-colors">Contact</Link>
      </div>

      {/* Right: Auth */}
      <div className="flex items-center gap-3">
        {isLoaded && isSignedIn && (
          <>
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 text-[#27187e] text-sm font-bold hover:opacity-80 transition-opacity">
              <LayoutDashboard size={15} /> Dashboard
            </Link>
            <UserButton />
          </>
        )}
        {isLoaded && !isSignedIn && (
          <>
            <Link href="/sign-in" className="hidden sm:block text-[#27187e] text-sm font-bold hover:opacity-80 transition-opacity">
              Sign In
            </Link>
            <Link href="/sign-up" className="bg-[#27187e] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all shadow-md">
              Get Started
            </Link>
          </>
        )}
        {/* Loading state skeleton */}
        {!isLoaded && (
          <div className="w-8 h-8 rounded-full bg-[#27187e]/10 animate-pulse" />
        )}
      </div>
    </nav>
  )
}

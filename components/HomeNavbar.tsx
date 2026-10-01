'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { LayoutDashboard } from 'lucide-react'
import { useState } from 'react'

export default function HomeNavbar() {
  const { isSignedIn, isLoaded } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between border border-white/20 shadow-md relative z-50">
      {/* Left: Logo */}
      <Link href="/" className="text-2xl font-bold tracking-tight text-[#27187e]">
        Zanrosh
      </Link>

      {/* Center: Desktop Links */}
      <div className="hidden md:flex items-center gap-8 text-sm text-[#27187e] font-semibold">
        <Link href="/courses" className="hover:text-[#4A5043] transition-colors">Courses</Link>
        <Link href="/about" className="hover:text-[#4A5043] transition-colors">About</Link>
        <Link href="/contact" className="hover:text-[#4A5043] transition-colors">Contact</Link>
      </div>

      {/* Right: Auth & Mobile Menu Toggle */}
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
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className={`block w-6 h-0.5 bg-[#27187e] transition-transform ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#27187e] transition-opacity ${mobileOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#27187e] transition-transform ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="absolute top-[110%] left-0 right-0 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/20 flex flex-col gap-4 md:hidden animate-in fade-in slide-in-from-top-4">
          <Link href="/courses" className="text-[#27187e] font-bold" onClick={() => setMobileOpen(false)}>Courses</Link>
          <Link href="/about" className="text-[#27187e] font-bold" onClick={() => setMobileOpen(false)}>About</Link>
          <Link href="/contact" className="text-[#27187e] font-bold" onClick={() => setMobileOpen(false)}>Contact</Link>
          {isLoaded && isSignedIn && (
            <Link href="/dashboard" className="text-[#27187e] font-bold flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <LayoutDashboard size={15} /> Dashboard
            </Link>
          )}
          {isLoaded && !isSignedIn && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[#27187e]/10">
              <Link href="/sign-in" className="text-[#27187e] text-center font-bold py-2" onClick={() => setMobileOpen(false)}>Sign In</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

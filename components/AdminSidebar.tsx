'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/lib/types'
import {
  LayoutDashboard, BookOpen, CreditCard, Users,
  GraduationCap, ChevronRight, Shield, Crown,
} from 'lucide-react'

const adminLinks = [
  { href: '/admin',          label: 'Overview',  icon: <LayoutDashboard size={18} />, exact: true },
  { href: '/admin/courses',  label: 'My Courses', icon: <BookOpen size={18} /> },
  { href: '/admin/payments', label: 'Payments',   icon: <CreditCard size={18} /> },
  { href: '/admin/users',    label: 'Students',   icon: <Users size={18} /> },
]

const superAdminLinks = [
  { href: '/admin',              label: 'Admin Panel',  icon: <LayoutDashboard size={18} />, exact: true },
  { href: '/admin/courses',      label: 'All Courses',  icon: <BookOpen size={18} /> },
  { href: '/admin/payments',     label: 'All Payments', icon: <CreditCard size={18} /> },
  { href: '/admin/users',        label: 'All Users',    icon: <Users size={18} /> },
  { href: '/super-admin',        label: 'Super Dashboard', icon: <Crown size={18} /> },
]

interface AdminSidebarProps {
  role?: UserRole
}

export default function AdminSidebar({ role = 'admin' }: AdminSidebarProps) {
  const pathname = usePathname()
  const isSuperAdmin = role === 'super_admin'
  const links = isSuperAdmin ? superAdminLinks : adminLinks

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          {isSuperAdmin
            ? <Crown size={20} color="var(--amber)" />
            : <GraduationCap size={20} color="var(--accent-light)" />}
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {isSuperAdmin ? 'Super Admin' : 'Admin Panel'}
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '1.75rem' }}>
          Zanrosh Academy
        </p>
      </div>

      {/* Nav links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        {links.map((l) => {
          const active = l.exact
            ? pathname === l.href
            : pathname.startsWith(l.href) && l.href !== '/admin'
              ? true
              : pathname === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`sidebar-link${active ? ' active' : ''}`}
            >
              {l.icon}
              <span style={{ flex: 1 }}>{l.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* Role badge */}
      <div style={{
        marginTop: 'auto', padding: '0.75rem',
        background: isSuperAdmin ? 'rgba(245,158,11,0.08)' : 'rgba(124,58,237,0.08)',
        borderRadius: '0.625rem',
        border: `1px solid ${isSuperAdmin ? 'rgba(245,158,11,0.25)' : 'rgba(124,58,237,0.2)'}`,
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Logged in as</p>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: isSuperAdmin ? 'var(--amber)' : 'var(--accent-light)' }}>
          {isSuperAdmin ? '👑 Super Administrator' : '🛡️ Administrator'}
        </p>
      </div>
    </aside>
  )
}

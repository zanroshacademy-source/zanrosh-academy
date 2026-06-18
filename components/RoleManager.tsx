'use client'

import { useState } from 'react'
import { Loader2, Crown, Shield, GraduationCap, ChevronDown } from 'lucide-react'

interface RoleManagerProps {
  targetClerkId: string
  currentRole: string
}

const ROLES = [
  { value: 'student', label: 'Student', icon: <GraduationCap size={14} />, color: 'var(--green)' },
  { value: 'admin',   label: 'Admin',   icon: <Shield size={14} />,        color: 'var(--red)' },
  { value: 'super_admin', label: 'Super Admin', icon: <Crown size={14} />, color: 'var(--amber)' },
]

export default function RoleManager({ targetClerkId, currentRole }: RoleManagerProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = async (newRole: string) => {
    if (newRole === role) return
    setLoading(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetClerkId, role: newRole }),
      })
      if (res.ok) {
        setRole(newRole)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative' }}>
        <select
          value={role}
          onChange={(e) => handleChange(e.target.value)}
          disabled={loading}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '0.375rem 2rem 0.375rem 0.75rem',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            appearance: 'none',
            minWidth: 120,
          }}
        >
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
      </div>
      {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />}
      {saved && <span style={{ color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600 }}>✓ Saved</span>}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Ban, CheckCircle, Loader2 } from 'lucide-react'

interface BanButtonProps {
  targetClerkId: string
  isBanned: boolean
  isSelf: boolean
}

export default function BanButton({ targetClerkId, isBanned: initialBanned, isSelf }: BanButtonProps) {
  const [banned, setBanned] = useState(initialBanned)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  if (isSelf) return null // cannot ban yourself

  const toggle = async () => {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetClerkId, isBanned: !banned }),
      })
      if (res.ok) {
        setBanned(b => !b)
        setMsg(!banned ? 'Banned' : 'Unbanned')
        setTimeout(() => setMsg(''), 2500)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        onClick={toggle}
        disabled={loading}
        title={banned ? 'Unban user' : 'Ban user'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.3rem 0.7rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          border: '1px solid',
          transition: 'all 0.15s',
          background: banned ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          borderColor: banned ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
          color: banned ? '#34d399' : '#f87171',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading
          ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          : banned
          ? <CheckCircle size={12} />
          : <Ban size={12} />
        }
        {banned ? 'Unban' : 'Ban'}
      </button>
      {msg && (
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: banned ? '#f87171' : '#34d399' }}>
          ✓ {msg}
        </span>
      )}
    </div>
  )
}

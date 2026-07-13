'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

export default function UserSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query) {
        params.set('q', query)
      } else {
        params.delete('q')
      }
      
      router.push(`?${params.toString()}`)
    }, 300) // debounce

    return () => clearTimeout(handler)
  }, [query, router, searchParams])

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '24rem' }}>
      <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      <input
        type="text"
        placeholder="Search by name, email, or ID..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem 0.75rem 2.5rem',
          borderRadius: '9999px',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          outline: 'none',
          fontSize: '0.9rem'
        }}
      />
    </div>
  )
}

import { DEV_MODE } from '@/lib/dev-mode'
import { MOCK_USERS } from '@/lib/mock-data'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Purchase from '@/models/Purchase'
import { isSuperAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Shield, GraduationCap, Users, Crown, Ban } from 'lucide-react'
import RoleManager from '@/components/RoleManager'
import BanButton from '@/components/BanButton'
import UserSearch from '@/components/UserSearch'
import { auth } from '@clerk/nextjs/server'

async function getUsers() {
  if (DEV_MODE) return MOCK_USERS
  await connectDB()
  return User.find().sort({ createdAt: -1 }).lean()
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const superAdmin = await isSuperAdmin()
  // Regular admins are redirected — this page is super_admin or dev_mode only
  if (!superAdmin && !DEV_MODE) redirect('/admin')

  let users: any[] = await getUsers()
  
  if (q) {
    const lowercaseQuery = q.toLowerCase()
    users = users.filter((u: any) => 
      (u.fullName || u.name || '').toLowerCase().includes(lowercaseQuery) ||
      (u.email || '').toLowerCase().includes(lowercaseQuery) ||
      (u.clerkId || '').toLowerCase().includes(lowercaseQuery)
    )
  }

  // Fetch the latest expiresAt for all users
  const userIds = users.map((u: any) => u.clerkId)
  const purchases = await Purchase.find({ userId: { $in: userIds }, status: 'approved' })
    .select('userId expiresAt')
    .lean()
    
  const userExpirations: Record<string, Date> = {}
  purchases.forEach((p: any) => {
    if (p.expiresAt) {
      if (!userExpirations[p.userId] || p.expiresAt > userExpirations[p.userId]) {
        userExpirations[p.userId] = p.expiresAt
      }
    }
  })
  const superAdmins = users.filter((u: any) => u.role === 'super_admin')
  const admins = users.filter((u: any) => u.role === 'admin')
  const students = users.filter((u: any) => u.role === 'student')
  const bannedCount = users.filter((u: any) => u.isBanned).length

  // Get current super admin's clerkId to prevent self-ban
  const { userId: selfClerkId } = await auth()

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={28} color="var(--accent-light)" /> User Management
          </h1>
          <p className="section-subtitle">Manage roles and access for all platform users</p>
        </div>
        
        <UserSearch />
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <span className="badge badge-free"><Users size={12} /> {users.length} Total</span>
        <span style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)', display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, gap: '0.25rem' }}>
          <Crown size={12} /> {superAdmins.length} Super Admin{superAdmins.length !== 1 ? 's' : ''}
        </span>
        <span className="badge badge-rejected"><Shield size={12} /> {admins.length} Admin{admins.length !== 1 ? 's' : ''}</span>
        <span className="badge badge-approved"><GraduationCap size={12} /> {students.length} Student{students.length !== 1 ? 's' : ''}</span>
        {bannedCount > 0 && (
          <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, gap: '0.25rem' }}>
            <Ban size={12} /> {bannedCount} Banned
          </span>
        )}
      </div>

      {users.length === 0 ? (
        <div className="alert alert-info">No users have signed up yet.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Clerk ID</th>
                <th>Joined</th>
                <th>Latest Expiry</th>
                {superAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user._id?.toString()} style={{ opacity: user.isBanned ? 0.55 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{user.fullName || user.name || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td>
                    <span className={`badge ${
                      user.role === 'super_admin' ? 'badge-pending'
                      : user.role === 'admin' ? 'badge-rejected'
                      : 'badge-approved'
                    }`}>
                      {user.role === 'super_admin' && <Crown size={11} />}
                      {user.role === 'admin' && <Shield size={11} />}
                      {user.role === 'student' && <GraduationCap size={11} />}
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.isBanned
                      ? <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', background:'rgba(239,68,68,0.12)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:700 }}><Ban size={10}/>Banned</span>
                      : <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', background:'rgba(16,185,129,0.1)', color:'#34d399', border:'1px solid rgba(16,185,129,0.25)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:700 }}>Active</span>
                    }
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.clerkId}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-PK')}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {userExpirations[user.clerkId] ? (
                      userExpirations[user.clerkId] > new Date() 
                        ? <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>{new Date(userExpirations[user.clerkId]).toLocaleDateString('en-PK')}</span>
                        : <span style={{ color: 'var(--red)', fontWeight: 600 }}>Expired</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  {superAdmin && (
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <RoleManager
                          targetClerkId={user.clerkId}
                          currentRole={user.role}
                        />
                        <BanButton
                          targetClerkId={user.clerkId}
                          isBanned={!!user.isBanned}
                          isSelf={user.clerkId === selfClerkId}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

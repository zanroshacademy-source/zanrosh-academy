import { DEV_MODE } from '@/lib/dev-mode'
import { MOCK_USERS } from '@/lib/mock-data'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { isSuperAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Shield, GraduationCap, Users, Crown } from 'lucide-react'
import RoleManager from '@/components/RoleManager'

async function getUsers() {
  if (DEV_MODE) return MOCK_USERS
  await connectDB()
  return User.find().sort({ createdAt: -1 }).lean()
}

export default async function AdminUsersPage() {
  const superAdmin = await isSuperAdmin()
  // Regular admins are redirected — this page is super_admin or dev_mode only
  if (!superAdmin && !DEV_MODE) redirect('/admin')

  const users = await getUsers()
    const superAdmins = users.filter((u: any) => u.role === 'super_admin')
    const admins = users.filter((u: any) => u.role === 'admin')
    const students = users.filter((u: any) => u.role === 'student')

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={28} color="var(--accent-light)" /> User Management
        </h1>
        <p className="section-subtitle">Manage roles and access for all platform users</p>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <span className="badge badge-free"><Users size={12} /> {users.length} Total</span>
        <span style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)', display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, gap: '0.25rem' }}>
          <Crown size={12} /> {superAdmins.length} Super Admin{superAdmins.length !== 1 ? 's' : ''}
        </span>
        <span className="badge badge-rejected"><Shield size={12} /> {admins.length} Admin{admins.length !== 1 ? 's' : ''}</span>
        <span className="badge badge-approved"><GraduationCap size={12} /> {students.length} Student{students.length !== 1 ? 's' : ''}</span>
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
                <th>Clerk ID</th>
                <th>Joined</th>
                {superAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {users.map((user: any) => (
                <tr key={user._id?.toString()}>
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
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.clerkId}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-PK')}
                  </td>
                  {superAdmin && (
                    <td>
                      <RoleManager
                        targetClerkId={user.clerkId}
                        currentRole={user.role}
                      />
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

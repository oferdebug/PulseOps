'use client';

import { Crown, Loader2, Shield, User } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { type UserRole, useRole, useRoleManagement } from '@/hooks/useRole';

const ROLE_CONFIG: Record<
  UserRole,
  { icon: React.ElementType; label: string; color: string }
> = {
  admin: {
    icon: Crown,
    label: 'Admin',
    color: 'var(--app-priority-critical)',
  },
  agent: { icon: Shield, label: 'Agent', color: 'var(--app-accent)' },
  customer: {
    icon: User,
    label: 'Customer',
    color: 'var(--app-stat-users)',
  },
};

export default function RolesPage() {
  const { user } = useCurrentUser();
  const { isAdmin, loading: roleLoading } = useRole(user?.id);
  const { users, loading, updateRole } = useRoleManagement();

  if (roleLoading || loading) {
    return (
      <div className='flex justify-center py-24'>
        <Loader2
          size={20}
          className='animate-spin'
          style={{ color: 'var(--app-text-faint)' }}
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className='flex flex-col items-center gap-3 py-24'
        style={{ color: 'var(--app-text-faint)' }}
      >
        <Shield size={32} />
        <p className='text-sm font-bold'>Admin access required</p>
      </div>
    );
  }

  return (
    <div
      className='min-h-screen'
      style={{ background: 'var(--app-bg)' }}
    >
      <div className='space-y-6 p-8' >
        <div
          className='animate-fade-in-up opacity-0'
          style={{ animationFillMode: 'forwards' }}
        >
          <div className='flex items-center gap-3'>
            <div
              className='flex h-10 w-10 items-center justify-center rounded-md'
              style={{
                background: 'var(--app-accent-dim)',
                border: '1px solid var(--app-accent-border)',
              }}
            >
              <Crown size={18} style={{ color: 'var(--app-accent-text)' }} />
            </div>
            <div>
              <h1
                className='text-2xl font-bold tracking-tight'
                style={{ color: 'var(--app-text-primary)' }}
              >
                Role Management
              </h1>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                Assign admin, agent, or customer roles to users
              </p>
            </div>
          </div>
        </div>

        {/* Role legend */}
        <div className='flex gap-4'>
          {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
            const cfg = ROLE_CONFIG[r];
            const Icon = cfg.icon;
            return (
              <div
                key={r}
                className='flex items-center gap-2 rounded-md px-4 py-2'
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                }}
              >
                <Icon size={13} style={{ color: cfg.color }} />
                <span
                  className='text-xs font-bold'
                  style={{ color: 'var(--app-text-secondary)' }}
                >
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Users table */}
        <div className='glass-card overflow-hidden'>
          <div className='card-accent-line' />
          <table className='w-full'>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--app-border)' }}>
                {['User', 'Email', 'Role', ''].map((h) => (
                  <th
                    key={h}
                    className='px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const cfg = ROLE_CONFIG[u.role];
                const Icon = cfg.icon;
                const isSelf = u.id === user?.id;
                return (
                  <tr
                    key={u.id}
                    style={{ borderBottom: '1px solid var(--app-border)' }}
                  >
                    <td className='px-6 py-4'>
                      <span
                        className='text-sm font-semibold'
                        style={{ color: 'var(--app-text-primary)' }}
                      >
                        {u.full_name || '—'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className='text-xs'
                        style={{ color: 'var(--app-text-muted)' }}
                      >
                        {u.email}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Icon size={13} style={{ color: cfg.color }} />
                        <span
                          className='text-xs font-bold'
                          style={{ color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      {!isSelf && (
                        <select
                          value={u.role}
                          onChange={(e) =>
                            updateRole(u.id, e.target.value as UserRole)
                          }
                          className='rounded-lg px-3 py-1.5 text-xs font-semibold'
                          style={{
                            background: 'var(--app-surface)',
                            border: '1px solid var(--app-border)',
                            color: 'var(--app-text-secondary)',
                            outline: 'none',
                          }}
                        >
                          <option value='admin'>Admin</option>
                          <option value='agent'>Agent</option>
                          <option value='customer'>Customer</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

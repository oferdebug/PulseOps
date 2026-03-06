'use client';

import {
  Plus,
  RefreshCw,
  Search,
  Shield,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type UserRole = 'admin' | 'technician' | 'user';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  technician: 'Technician',
  user: 'User',
};
const ROLE_ICON: Record<UserRole, React.ElementType> = {
  admin: Shield,
  technician: Wrench,
  user: User,
};
const ROLE_COLOR: Record<UserRole, string> = {
  admin: '#f43f5e',
  technician: '#fb923c',
  user: '#818cf8',
};
const ALL_ROLES: Array<UserRole | 'all'> = [
  'all',
  'admin',
  'technician',
  'user',
];

function Panel({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      <div
        className='h-px'
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
        }}
      />
      {children}
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 hover:-translate-y-0.5'
      style={
        active
          ? {
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#a5b4fc',
            }
          : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
            }
      }
    >
      {label}
    </button>
  );
}

export default function UsersPage() {
  useCurrentUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('profiles')
      .select(
        'id, full_name, email, role, department, phone, is_active, created_at',
      )
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setProfiles(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const filtered = profiles.filter(
    (p) =>
      (p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())) &&
      (roleFilter === 'all' || p.role === roleFilter),
  );

  return (
    <div
      className='relative min-h-screen space-y-6 p-8'
      style={{ background: '#06060f' }}
    >
      {/* Ambient */}
      <div
        className='pointer-events-none fixed inset-0 overflow-hidden'
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '30vw',
            height: '30vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className='relative' style={{ zIndex: 1 }}>
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 mb-6 flex items-end justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <p
              className='mb-1 text-xs font-bold uppercase tracking-widest'
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Team
            </p>
            <h1
              className='text-4xl font-black tracking-tight'
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Users
            </h1>
            <p
              className='mt-1 text-sm'
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {loading
                ? 'Loading…'
                : `${filtered.length} user${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link
            href='/users/new'
            className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90'
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow:
                '0 4px 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Plus size={14} /> Add User
          </Link>
        </div>

        {/* Filters */}
        <Panel
          className='animate-fade-in-up opacity-0 mb-4'
          style={
            {
              animationDelay: '80ms',
              animationFillMode: 'forwards',
            } as React.CSSProperties
          }
        >
          <div className='flex flex-wrap items-center gap-3 p-4'>
            <div className='relative min-w-[200px] flex-1'>
              <Search
                size={13}
                className='absolute left-3 top-1/2 -translate-y-1/2'
                style={{ color: 'rgba(255,255,255,0.25)' }}
              />
              <input
                placeholder='Search by name or email…'
                className='h-9 w-full rounded-xl pl-9 pr-4 text-sm outline-none'
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex flex-wrap gap-1.5'>
              {ALL_ROLES.map((r) => (
                <Pill
                  key={r}
                  label={r === 'all' ? 'All' : ROLE_LABELS[r as UserRole]}
                  active={roleFilter === r}
                  onClick={() => setRoleFilter(r)}
                />
              ))}
            </div>
            <button
              type='button'
              onClick={fetchProfiles}
              disabled={loading}
              className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10'
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
            </button>
          </div>
        </Panel>

        {/* List */}
        <Panel
          className='animate-fade-in-up opacity-0'
          style={
            {
              animationDelay: '160ms',
              animationFillMode: 'forwards',
            } as React.CSSProperties
          }
        >
          <div
            className='px-5 py-4'
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className='text-sm font-bold text-white'>All Users</p>
            <p className='text-xs' style={{ color: 'rgba(255,255,255,0.3)' }}>
              Click a user to view or edit
            </p>
          </div>

          {error && (
            <div
              className='mx-5 my-3 rounded-xl px-4 py-3 text-sm'
              style={{
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.2)',
                color: '#fca5a5',
              }}
            >
              Failed to load: {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div
              className='flex flex-col items-center gap-3 py-16'
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <Users size={36} />
              <p className='text-sm font-medium'>No users found</p>
              {(search || roleFilter !== 'all') && (
                <button
                  type='button'
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('all');
                  }}
                  className='rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-white/10'
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!error &&
            filtered.map((profile, i) => {
              const RoleIcon = ROLE_ICON[profile.role];
              const roleColor = ROLE_COLOR[profile.role];
              return (
                <Link
                  key={profile.id}
                  href={`/users/${profile.id}`}
                  className='flex items-center gap-4 px-5 py-3.5 transition-all duration-150 hover:bg-white/3'
                  style={{
                    borderBottom:
                      i < filtered.length - 1
                        ? '1px solid rgba(255,255,255,0.04)'
                        : 'none',
                  }}
                >
                  {/* Avatar */}
                  <div
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black'
                    style={{
                      background: `${roleColor}20`,
                      border: `1px solid ${roleColor}40`,
                      color: roleColor,
                    }}
                  >
                    {profile.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>

                  {/* Name + email */}
                  <div className='min-w-0 flex-1'>
                    <p
                      className='truncate text-sm font-semibold'
                      style={{ color: 'rgba(255,255,255,0.85)' }}
                    >
                      {profile.full_name || '—'}
                    </p>
                    <p
                      className='truncate text-xs'
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {profile.email}
                    </p>
                  </div>

                  {/* Department */}
                  {profile.department && (
                    <span
                      className='hidden shrink-0 text-xs sm:block'
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      {profile.department}
                    </span>
                  )}

                  {/* Role badge */}
                  <span
                    className='flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize'
                    style={{ background: `${roleColor}18`, color: roleColor }}
                  >
                    <RoleIcon size={10} />
                    {ROLE_LABELS[profile.role]}
                  </span>

                  {/* Status dot */}
                  <div className='flex shrink-0 items-center gap-1.5'>
                    <span
                      className='h-1.5 w-1.5 rounded-full'
                      style={{
                        background: profile.is_active ? '#4ade80' : '#4b5563',
                        boxShadow: profile.is_active
                          ? '0 0 6px #4ade80'
                          : 'none',
                      }}
                    />
                    <span
                      className='text-xs font-medium'
                      style={{
                        color: profile.is_active
                          ? '#4ade80'
                          : 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Link>
              );
            })}
        </Panel>
      </div>
    </div>
  );
}

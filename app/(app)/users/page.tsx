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
const ROLE_VAR: Record<UserRole, string> = {
  admin: 'var(--app-stat-open)',
  technician: 'var(--app-stat-resolution)',
  user: 'var(--app-stat-users)',
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
    <div className={`glass-card ${className}`} style={style}>
      <div className='card-accent-line' />
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
              background: 'var(--app-nav-active-bg)',
              border: '1px solid var(--app-nav-active-border)',
              color: 'var(--app-nav-active-text)',
            }
          : {
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-nav-idle-text)',
            }
      }
    >
      {label}
    </button>
  );
}

export default function UsersPage() {
  useCurrentUser();
export default function UsersPage() {
  const { user: currentUser } = useCurrentUser();
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
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, full_name, email, role, department, phone, is_active, created_at',
      )
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setProfiles(data ?? []);

    if (error) setError(error.message);
    else setProfiles(data || []);
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
      style={{ background: 'var(--app-bg)' }}
    >
      <div
        className='app-mesh pointer-events-none fixed inset-0 overflow-hidden'
        style={{ zIndex: 0 }}
      />

      <div className='relative' style={{ zIndex: 1 }}>
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 mb-6 flex items-end justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <p
              className='mb-1 text-xs font-bold uppercase tracking-widest'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Team
            </p>
            <h1 className='text-4xl font-black tracking-tight text-gradient-primary'>
              Users
            </h1>
            <p
              className='mt-1 text-sm'
              style={{ color: 'var(--app-text-muted)' }}
            >
              {loading
                ? 'Loading…'
                : `${filtered.length} user${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link
            href='/users/new'
            className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90'
            style={{
              background: 'var(--app-accent)',
              color: 'var(--primary-foreground)',
              boxShadow: '0 4px 20px var(--app-accent-dim)',
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
                style={{ color: 'var(--app-text-muted)' }}
              />
              <input
                placeholder='Search by name or email…'
                className='h-9 w-full rounded-xl pl-9 pr-4 text-sm outline-none'
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text-primary)',
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
              className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-(--app-surface-raised)'
              style={{ color: 'var(--app-text-muted)' }}
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
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <p className='text-sm font-bold' style={{ color: 'var(--app-text-primary)' }}>All Users</p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Click a user to view or edit
            </p>
          </div>

          {error && (
            <div
              className='mx-5 my-3 rounded-xl px-4 py-3 text-sm'
              style={{
                background: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
                color: 'var(--destructive)',
              }}
            >
              Failed to load: {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div
              className='flex flex-col items-center gap-3 py-16'
              style={{ color: 'var(--app-text-faint)' }}
            >
              <Users size={36} />
              <p className='text-sm font-medium'>No users found</p>
              {(search || roleFilter !== 'all') && (
                <button
                  type='button'
  const filteredProfiles = profiles.filter((p) => {
    const matchSearch = p.full_name
      .toLowerCase()
      .includes(search.toLowerCase());
    p.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <>
      <div className={'space-y-6'}>
        <div className={'flex items-center justify-between'}>
          <div>
            <h1 className={'text-3xl font-semibold'}>Users</h1>
            <p className={'text-muted-foreground'}>
              {!loading
                ? `${filteredProfiles.length} user${filteredProfiles.length !== 1 ? 's' : ''} found`
                : 'loading...'}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href='/users/new'>
            <Plus size={16} className={'mr-2'} />
            Add User
          </Link>
        </Button>
        <>
          <Card>
            <CardContent className={'flex flex-wrap gap-3 pt-4'}>
              <div className={'relative min-w-[220px] flex-1'}>
                <Search
                  size={14}
                  className={
                    'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                  }
                />
                <Input
                  placeholder='Search By Username,Phone,AD User Or Email....'
                  className={'pl-8'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className={'flex gap-2'}>
                {ALL_ROLES.map((r) => (
                  <Button
                    key={r}
                    size={'sm'}
                    variant={roleFilter === r ? 'default' : 'outline'}
                    onClick={() => setRoleFilter(r as UserRole)}
                    className={'capitalize'}
                  >
                    {r === 'all' ? 'All' : ROLE_LABELS[r as UserRole]}
                  </Button>
                ))}
              </div>
              <Button
                size={'sm'}
                variant={'ghost'}
                onClick={() => fetchProfiles()}
                disabled={loading || !error}
              >
                <RefreshCw
                  size={16}
                  className={cn(loading && 'animate-spin')}
                />
              </Button>
            </CardContent>
          </Card>
        </>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>All Users</CardTitle>
          <CardDescription>Click a user to view or edit</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className='text-sm text-red-500'>Failed to load: {error}</p>
          )}

          {!loading && !error && filteredProfiles.length === 0 && (
            <div className='flex flex-col items-center gap-2 py-12 text-muted-foreground'>
              <Users size={32} className='opacity-30' />
              <p className='text-sm'>No users found</p>
              {(search || roleFilter !== 'all') && (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('all');
                  }}
                  className='rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-(--app-surface-raised)'
                  style={{
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-nav-idle-text)',
                  }}
                >
                  Clear filters
                </button>
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {!error &&
            filtered.map((profile, i) => {
              const RoleIcon = ROLE_ICON[profile.role];
              const roleVar = ROLE_VAR[profile.role];
            filteredProfiles.map((profile) => {
              const RoleIcon = ROLE_ICON[profile.role];
              return (
                <Link
                  key={profile.id}
                  href={`/users/${profile.id}`}
                  className='flex items-center gap-4 px-5 py-3.5 transition-all duration-150 hover:bg-(--app-surface-raised)'
                  style={{
                    borderBottom:
                      i < filtered.length - 1
                        ? '1px solid var(--app-border)'
                        : 'none',
                  }}
                >
                  <div
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black'
                    style={{
                      background: `color-mix(in srgb, ${roleVar} 18%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${roleVar} 40%, transparent)`,
                      color: roleVar,
                    }}
                  >
                    {profile.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p
                      className='truncate text-sm font-semibold'
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {profile.full_name || '—'}
                    </p>
                    <p
                      className='truncate text-xs'
                      style={{ color: 'var(--app-text-muted)' }}
                    >
                      {profile.email}
                    </p>
                  </div>
                  {profile.department && (
                    <span
                      className='hidden shrink-0 text-xs sm:block'
                      style={{ color: 'var(--app-text-muted)' }}
                    >
                      {profile.department}
                    </span>
                  )}
                  <span
                    className='flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize'
                    style={{
                      background: `color-mix(in srgb, ${roleVar} 18%, transparent)`,
                      color: roleVar,
                    }}
                  >
                    <RoleIcon size={10} />
                    {ROLE_LABELS[profile.role]}
                  </span>
                  <div className='flex shrink-0 items-center gap-1.5'>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${profile.is_active ? 'dot-healthy' : ''}`}
                      style={
                        profile.is_active
                          ? undefined
                          : {
                              background: 'var(--app-priority-low)',
                            }
                      }
                    />
                    <span
                      className='text-xs font-medium'
                      style={{
                        color: profile.is_active
                          ? 'var(--app-health-healthy)'
                          : 'var(--app-text-muted)',
                      }}
                  className='flex items-center justify-between rounded-lg border px-4 py-3 text-sm mb-2 hover:bg-muted/50 transition-colors'
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs'>
                      {profile.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className='min-w-0'>
                      <p className='truncate font-medium'>
                        {profile.full_name || '—'}
                      </p>
                      <p className='truncate text-xs text-muted-foreground'>
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  <div className='ml-4 flex shrink-0 items-center gap-2'>
                    {profile.department && (
                      <span className='text-xs text-muted-foreground hidden sm:block'>
                        {profile.department}
                      </span>
                    )}
                    <Badge
                      variant={ROLE_VARIANT[profile.role]}
                      className='flex items-center gap-1 text-xs capitalize'
                    >
                      <RoleIcon size={10} />
                      {ROLE_LABELS[profile.role]}
                    </Badge>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        profile.is_active
                          ? 'text-green-500'
                          : 'text-muted-foreground',
                      )}
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
        </CardContent>
      </Card>
    </>
  );
}

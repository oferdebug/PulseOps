/**
 * Users List Page — /users
 *
 * Displays all profiles with search and role filtering.
 * Only authenticated users can view. Only admins can delete.
 *
 * TODO:
 * - Add pagination once user count grows.
 * - Add bulk actions (deactivate, change role).
 */
/** biome-ignore-all lint/complexity/noUselessFragments: <explanation> */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Users,
  RefreshCw,
  Shield,
  Wrench,
  User,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

const ROLE_VARIANT: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  technician: 'secondary',
  user: 'outline',
};

const ALL_ROLES: Array<UserRole | 'all'> = [
  'all',
  'admin',
  'technician',
  'user',
];

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
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, full_name, email, role, department, phone, is_active, created_at',
      )
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setProfiles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

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
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {!error &&
            filteredProfiles.map((profile) => {
              const RoleIcon = ROLE_ICON[profile.role];
              return (
                <Link
                  key={profile.id}
                  href={`/users/${profile.id}`}
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
        </CardContent>
      </Card>
    </>
  );
}

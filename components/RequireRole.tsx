'use client';

import { ShieldAlert } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { UserRole } from '@/hooks/useRole';
import { useRole } from '@/hooks/useRole';

export function RequireRole({
  allowed,
  children,
  fallback,
}: {
  allowed: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useCurrentUser();
  const { role, loading } = useRole(user?.id);

  if (loading) return null;

  if (!allowed.includes(role)) {
    return (
      fallback ?? (
        <div
          className='flex flex-col items-center justify-center gap-4 py-24'
          style={{ color: 'var(--app-text-faint)' }}
        >
          <ShieldAlert size={32} />
          <p className='text-sm font-semibold'>Access Denied</p>
          <p className='text-xs'>
            You don&apos;t have permission to view this page.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}

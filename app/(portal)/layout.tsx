'use client';

import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [orgName, setOrgName] = useState('Support Portal');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/Login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('organization_id, organizations(name)')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.organization_id) {
          const org = data.organizations as { name: string } | null;
          setOrgName(org?.name ?? 'Support Portal');
        }
      });
  }, [user?.id]);

  if (loading || !user) {
    return (
      <div
        className='flex min-h-screen items-center justify-center'
        style={{ background: 'var(--app-bg)' }}
      >
        <div
          className='h-6 w-6 animate-spin rounded-full border-2'
          style={{
            borderColor: 'var(--app-border)',
            borderTopColor: 'var(--app-accent)',
          }}
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen' style={{ background: 'var(--app-bg)' }}>
      {/* Portal top bar */}
      <header
        className='sticky top-0 z-40'
        style={{
          background: 'var(--app-surface)',
          borderBottom: '1px solid var(--app-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className='mx-auto flex max-w-5xl items-center justify-between px-6 py-3'>
          <div className='flex items-center gap-3'>
            <div
              className='flex h-8 w-8 items-center justify-center rounded-lg'
              style={{
                background: 'var(--app-accent-dim)',
                border: '1px solid var(--app-accent-border)',
              }}
            >
              <span
                className='text-sm font-bold'
                style={{ color: 'var(--app-accent-text)' }}
              >
                P
              </span>
            </div>
            <span
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              {orgName}
            </span>
          </div>

          <nav className='flex items-center gap-1'>
            <PortalNavLink href='/portal'>Home</PortalNavLink>
            <PortalNavLink href='/portal/my-tickets'>My Tickets</PortalNavLink>
            <PortalNavLink href='/portal/knowledge-base'>
              Knowledge Base
            </PortalNavLink>
          </nav>

          <div className='flex items-center gap-3'>
            <span
              className='text-xs'
              style={{ color: 'var(--app-text-muted)' }}
            >
              {user?.email}
            </span>
            <button
              type='button'
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push('/Login');
              }}
              className='rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5'
              style={{
                background: 'var(--app-surface-raised)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-secondary)',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-5xl px-6 py-8'>{children}</main>
    </div>
  );
}

function PortalNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <button
      type='button'
      onClick={() => router.push(href)}
      className='rounded-lg px-3 py-1.5 text-xs font-semibold transition-all'
      style={
        isActive
          ? {
              background: 'var(--app-nav-active-bg)',
              border: '1px solid var(--app-nav-active-border)',
              color: 'var(--app-nav-active-text)',
            }
          : {
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--app-text-muted)',
            }
      }
    >
      {children}
    </button>
  );
}

'use client';

import { LogOut, Moon, Sun, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NAV_ITEMS } from '@/lib/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AppSidebar() {
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/Login');
  }

  return (
    <Sidebar
      style={{
        background: 'var(--app-sidebar-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--app-sidebar-border)',
      }}
    >
      {/* Ambient glows */}
      <div
        className='pointer-events-none absolute inset-0 overflow-hidden'
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            left: '-20%',
            width: '140%',
            height: '50%',
            borderRadius: '50%',
            background: `radial-gradient(circle, var(--app-sidebar-glow-top) 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '-20%',
            width: '100%',
            height: '30%',
            borderRadius: '50%',
            background: `radial-gradient(circle, var(--app-sidebar-glow-bottom) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* ── Logo ── */}
      <SidebarHeader
        className='relative px-5 py-5'
        style={{
          borderBottom: '1px solid var(--app-footer-header-border)',
          zIndex: 1,
        }}
      >
        <Link href='/dashboard' className='group flex items-center gap-3'>
          <div
            className='flex h-9 w-9 items-center justify-center rounded-md'
            style={{ background: '#10b981' }}
          >
            <Zap size={16} color='#fff' />
          </div>
          <span
            className='text-base font-bold tracking-tight'
            style={{ color: 'var(--app-text-primary)' }}
          >
            PulseOps
          </span>
        </Link>
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent className='relative px-3 py-4' style={{ zIndex: 1 }}>
        <SidebarGroup>
          <SidebarMenu className='gap-1'>
            {NAV_ITEMS.map(({ href, label, icon: Icon, matchPrefix }) => {
              const isActive = matchPrefix
                ? pathname === href || pathname.startsWith(`${href}/`)
                : pathname === href;

              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className='h-10 rounded-md px-3 text-sm font-medium transition-all duration-200'
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
                            color: 'var(--app-nav-idle-text)',
                          }
                    }
                  >
                    <Link href={href} className='flex items-center gap-3'>
                      <Icon
                        size={16}
                        style={{
                          color: isActive
                            ? 'var(--app-nav-active-icon)'
                            : 'var(--app-nav-idle-icon)',
                        }}
                      />
                      <span>{label}</span>
                      {isActive && (
                        <span
                          className='ml-auto h-1.5 w-1.5 rounded-full'
                          style={{
                            background: 'var(--app-nav-active-dot)',
                            boxShadow: '0 0 6px var(--app-nav-active-dot)',
                          }}
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter
        className='relative p-3'
        style={{
          borderTop: '1px solid var(--app-footer-header-border)',
          zIndex: 1,
        }}
      >
        <div
          className='flex items-center gap-2 rounded-md p-2'
          style={{
            background: 'var(--app-footer-bg)',
            border: '1px solid var(--app-footer-border)',
          }}
        >
          {/* Avatar */}
          <div
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold'
            style={{
              background: '#10b981',
              color: '#fff',
            }}
          >
            {user?.fullName?.[0]?.toUpperCase() ?? '?'}
          </div>

          {/* Name + email */}
          <div className='min-w-0 flex-1'>
            <p
              className='truncate text-xs font-semibold'
              style={{ color: 'var(--app-user-name)' }}
            >
              {user?.fullName ?? '—'}
            </p>
            <p
              className='truncate text-[10px]'
              style={{ color: 'var(--app-user-email)' }}
            >
              {user?.email ?? ''}
            </p>
          </div>

          {/* Theme toggle */}
          <button
            type='button'
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
            className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200'
            style={{ color: 'var(--app-icon-btn-color)' }}
            aria-label='Toggle theme'
          >
            {mounted ? (
              resolvedTheme === 'dark' ? (
                <Sun size={13} />
              ) : (
                <Moon size={13} />
              )
            ) : (
              <div
                className='h-[13px] w-[13px] rounded-full'
                style={{ background: 'var(--app-text-faint)', opacity: 0.3 }}
              />
            )}
          </button>

          {/* Logout */}
          <button
            type='button'
            onClick={handleLogout}
            className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200'
            style={{ color: 'var(--app-icon-btn-color)' }}
            aria-label='Sign out'
          >
            <LogOut size={13} />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

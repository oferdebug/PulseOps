/**
 * @module AppLayout
 *
 * Root authenticated shell — wraps every protected page with a themed sidebar
 * and a content inset area.
 *
 * Architecture notes:
 * - Theme-awareness is driven entirely by CSS custom properties defined in
 *   globals.css under the `--app-*` namespace. The sidebar used to carry
 *   hardcoded dark-only rgba() values; those have been replaced so light/dark
 *   both receive intentional colours (vibrant indigo tints for light mode,
 *   the original near-black glass for dark mode).
 * - The shadcn <Sidebar> component controls its own background via the
 *   `--sidebar` token, but we override it with `--app-sidebar-bg` via an
 *   inline `style` so we keep glassmorphism without fighting shadcn internals.
 * - NAV_ITEMS is a static config array — add routes here, never inside JSX.
 * - `useCurrentUser` is intentionally duplicated across Dashboard and here;
 *   once a global user-store exists, both can be refactored to consume it.
 *
 * TODO: replace inline logout handler with a shared `authService.signOut()`
 * TODO: animate sidebar collapse transition (width + opacity)
 */
'use client';

import {
  Activity,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  Ticket,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import SearchModal from '@/components/SearchModal';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    matchPrefix: false,
  },
  {
    href: '/knowledge-base',
    label: 'Knowledge Base',
    icon: BookOpen,
    matchPrefix: true,
  },
  { href: '/tickets', label: 'Tickets', icon: Ticket, matchPrefix: true },
  { href: '/users', label: 'Users', icon: Users, matchPrefix: true },
  {
    href: '/activity-logs',
    label: 'Activity Logs',
    icon: Activity,
    matchPrefix: true,
  },
  { href: '/settings', label: 'Settings', icon: Settings, matchPrefix: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: userLoading } = useCurrentUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/Login');
  }

  return (
    <SidebarProvider>
      <Sidebar
        style={{
          background: 'var(--app-sidebar-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--app-sidebar-border)',
        }}
      >
        {/* Ambient glow orbs — colours shift per theme via CSS vars */}
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

        <SidebarHeader
          className='relative px-5 py-5'
          style={{
            borderBottom: '1px solid var(--app-footer-header-border)',
            zIndex: 1,
          }}
        >
          <Link href='/dashboard' className='group flex items-center gap-3'>
            <div
              className='flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105'
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow:
                  '0 4px 16px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <Zap size={16} color='#fff' />
            </div>
            <span className='text-base font-black tracking-tight'>
              <span style={{ color: 'var(--app-logo-text)' }}>Pulse</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #a5b4fc, #6366f1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ops
              </span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className='relative px-3 py-4' style={{ zIndex: 1 }}>
          <SidebarGroup>
            <SidebarMenu className='gap-1'>
              {NAV_ITEMS.map(({ href, label, icon: Icon, matchPrefix }) => {
                const isActive = matchPrefix
                  ? pathname.startsWith(href)
                  : pathname === href;

                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className='h-10 rounded-xl px-3 text-sm font-medium transition-all duration-200'
                      style={
                        isActive
                          ? {
                              background: 'var(--app-nav-active-bg)',
                              border: '1px solid var(--app-nav-active-border)',
                              color: 'var(--app-nav-active-color)',
                              boxShadow: '0 0 20px var(--app-nav-active-glow)',
                            }
                          : {
                              background: 'transparent',
                              border: '1px solid transparent',
                              color: 'var(--app-nav-idle-color)',
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

        <div
          className='relative px-3 py-2'
          style={{
            zIndex: 1,
            borderTop: '1px solid var(--app-footer-header-border)',
          }}
        >
          <button
            type='button'
            onClick={() => setIsSearchOpen(true)}
            className='flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200'
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--app-nav-idle-text)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--app-icon-btn-hover)';
              e.currentTarget.style.color = 'var(--app-nav-idle-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--app-nav-idle-text)';
            }}
            aria-label='Search (Ctrl+K)'
          >
            <Search size={16} style={{ color: 'var(--app-nav-idle-icon)' }} />
            <span>Search</span>
            <kbd
              className='ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium'
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-muted)',
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        <SidebarFooter
          className='relative p-3'
          style={{
            borderTop: '1px solid var(--app-footer-header-border)',
            zIndex: 1,
          }}
        >
          <div
            className='flex items-center gap-2 rounded-xl p-2'
            style={{
              background: 'var(--app-footer-bg)',
              border: '1px solid var(--app-footer-border)',
            }}
          >
            <div
              className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black'
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
              }}
            >
              {userLoading ? '?' : (user?.fullName?.[0]?.toUpperCase() ?? '?')}
            </div>

            <div className='min-w-0 flex-1'>
              <p
                className='truncate text-xs font-semibold'
                style={{ color: 'var(--app-user-name)' }}
              >
                {userLoading ? '…' : (user?.fullName ?? '—')}
              </p>
              <p
                className='truncate text-[10px]'
                style={{ color: 'var(--app-user-email)' }}
              >
                {userLoading ? '…' : (user?.email ?? '')}
              </p>
            </div>

            <button
              type='button'
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200'
              style={{
                color: 'var(--app-icon-btn-color)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--app-icon-btn-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label='Toggle theme'
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            <button
              type='button'
              onClick={handleLogout}
              className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200'
              style={{
                color: 'var(--app-icon-btn-color)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--app-logout-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label='Sign out'
            >
              <LogOut size={13} />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset
        className='flex flex-col overflow-hidden'
        style={{ background: 'var(--app-inset-bg)' }}
      >
        <main className='flex-1 overflow-y-auto'>{children}</main>
      </SidebarInset>

      <SearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </SidebarProvider>
  );
}

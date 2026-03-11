/**
 * @module AppLayout
 * Root authenticated shell — collapsible sidebar + content area.
 * Emerald accent, warm surfaces, layered depth.
 * Ctrl+B toggles sidebar collapse. Ctrl+K opens search. Ctrl+N new ticket.
 */
'use client';

import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Moon,
  Search,
  Sun,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NAV_ITEMS } from '@/lib/navigation';
import { createClient } from '@/lib/supabase/client';

function SidebarCollapseToggle() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  return (
    <button
      type='button'
      onClick={toggleSidebar}
      className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors'
      style={{ color: 'var(--app-icon-btn-color)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--app-icon-btn-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
    </button>
  );
}

function AppSidebarContent() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: userLoading } = useCurrentUser();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/Login');
  }

  return (
    <>
      <SidebarHeader
        className={collapsed ? 'px-2 py-4' : 'px-4 py-5'}
        style={{ borderBottom: '1px solid var(--app-sidebar-border)' }}
      >
        <Link
          href='/dashboard'
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <div
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Zap size={16} color='#fff' />
          </div>
          {!collapsed && (
            <span
              className='text-[15px] font-bold tracking-tight'
              style={{ color: 'var(--app-logo-text)' }}
            >
              PulseOps
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className={collapsed ? 'px-1.5 py-3' : 'px-2.5 py-3'}>
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
                    tooltip={label}
                    className={`${collapsed ? 'h-9 justify-center rounded-lg px-0' : 'h-9 rounded-lg px-3'} text-[13px] font-medium transition-all duration-150`}
                    style={
                      isActive
                        ? {
                            background: 'var(--app-nav-active-bg)',
                            color: 'var(--app-nav-active-text)',
                            borderLeft: collapsed ? 'none' : '3px solid var(--app-accent)',
                            boxShadow: 'inset 0 0 0 1px var(--app-nav-active-border)',
                          }
                        : {
                            background: 'transparent',
                            color: 'var(--app-nav-idle-text)',
                            borderLeft: collapsed ? 'none' : '3px solid transparent',
                          }
                    }
                  >
                    <Link
                      href={href}
                      className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}
                    >
                      <Icon
                        size={16}
                        className='shrink-0'
                        style={{
                          color: isActive
                            ? 'var(--app-nav-active-icon)'
                            : 'var(--app-nav-idle-icon)',
                        }}
                      />
                      {!collapsed && <span>{label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Search shortcut */}
      <div
        className={collapsed ? 'px-1.5 py-2' : 'px-2.5 py-2'}
        style={{ borderTop: '1px solid var(--app-sidebar-border)' }}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <SearchTriggerButton collapsed />
            </TooltipTrigger>
            <TooltipContent side='right'>Search (Ctrl+K)</TooltipContent>
          </Tooltip>
        ) : (
          <SearchTriggerButton collapsed={false} />
        )}
      </div>

      {/* Footer */}
      <SidebarFooter
        className={collapsed ? 'p-1.5' : 'p-2.5'}
        style={{ borderTop: '1px solid var(--app-sidebar-border)' }}
      >
        <div
          className={`flex items-center ${collapsed ? 'flex-col gap-2 p-2' : 'gap-2.5 rounded-lg p-2.5'}`}
          style={{
            background: 'var(--app-footer-bg)',
            border: '1px solid var(--app-footer-border)',
            borderRadius: '8px',
          }}
        >
          {/* Avatar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold'
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  boxShadow: '0 1px 4px rgba(16, 185, 129, 0.25)',
                }}
              >
                {userLoading
                  ? '?'
                  : (user?.fullName?.[0]?.toUpperCase() ?? '?')}
              </div>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side='right'>
                {userLoading ? '…' : (user?.fullName ?? '—')}
              </TooltipContent>
            )}
          </Tooltip>

          {/* Name + email — hidden when collapsed */}
          {!collapsed && (
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
          )}

          {/* Collapse toggle */}
          <SidebarCollapseToggle />

          {/* Theme toggle */}
          {!collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  onClick={() =>
                    setTheme(theme === 'dark' ? 'light' : 'dark')
                  }
                  className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors'
                  style={{ color: 'var(--app-icon-btn-color)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'var(--app-icon-btn-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  aria-label='Toggle theme'
                >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side='top'>Toggle theme</TooltipContent>
            </Tooltip>
          )}

          {/* Logout */}
          {!collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  onClick={handleLogout}
                  className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors'
                  style={{ color: 'var(--app-icon-btn-color)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'var(--app-logout-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  aria-label='Sign out'
                >
                  <LogOut size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side='top'>Sign out</TooltipContent>
            </Tooltip>
          )}

          {/* Collapsed: show theme + logout vertically */}
          {collapsed && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    onClick={() =>
                      setTheme(theme === 'dark' ? 'light' : 'dark')
                    }
                    className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors'
                    style={{ color: 'var(--app-icon-btn-color)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'var(--app-icon-btn-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    aria-label='Toggle theme'
                  >
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side='right'>Toggle theme</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    onClick={handleLogout}
                    className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors'
                    style={{ color: 'var(--app-icon-btn-color)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'var(--app-logout-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    aria-label='Sign out'
                  >
                    <LogOut size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='right'>Sign out</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </>
  );
}

function SearchTriggerButton({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      type='button'
      data-search-trigger
      className={`flex w-full items-center ${collapsed ? 'justify-center rounded-lg p-2' : 'gap-2.5 rounded-lg px-3 py-2'} text-[13px] font-medium transition-colors`}
      style={{ color: 'var(--app-nav-idle-text)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--app-icon-btn-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      aria-label='Search (Ctrl+K)'
    >
      <Search size={15} className='shrink-0' style={{ color: 'var(--app-nav-idle-icon)' }} />
      {!collapsed && (
        <>
          <span>Search</span>
          <kbd
            className='ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium mono'
            style={{
              background: 'var(--app-surface-raised)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text-muted)',
            }}
          >
            ⌘K
          </kbd>
        </>
      )}
    </button>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K → search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
      // Ctrl+N / Cmd+N → new ticket
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        router.push('/tickets/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);

    // Wire search triggers (buttons with data-search-trigger)
  }, [router]);

  // Listen for clicks on search trigger buttons inside sidebar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-search-trigger]');
      if (target) setIsSearchOpen(true);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <>
      <SidebarProvider>
        <Sidebar
          collapsible='icon'
          style={{
            background: 'var(--app-sidebar-bg)',
            borderRight: '1px solid var(--app-sidebar-border)',
            boxShadow: '1px 0 8px rgba(0,0,0,0.04)',
          }}
        >
          <AppSidebarContent />
        </Sidebar>

        <SidebarInset
          className='flex flex-col overflow-hidden'
          style={{ background: 'var(--app-inset-bg)' }}
        >
          <main className='flex-1 overflow-y-auto'>{children}</main>
        </SidebarInset>

        <SearchModal
          open={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </SidebarProvider>

      <div className='fixed bottom-6 right-6' style={{ zIndex: 9999 }}>
        <NotificationBell
          open={isNotifOpen}
          onToggle={() => setIsNotifOpen((o) => !o)}
          onClose={() => setIsNotifOpen(false)}
        />
      </div>
    </>
  );
}

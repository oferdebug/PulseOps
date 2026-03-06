'use client';

import {
  Activity,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
  Ticket,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  const { user } = useCurrentUser();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/Login');
  }

  return (
    <SidebarProvider>
      <Sidebar
        style={{
          background: 'rgba(6,6,15,0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
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
              background:
                'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
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
              background:
                'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* ── Logo ── */}
        <SidebarHeader
          className='relative px-5 py-5'
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.05)',
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
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>Pulse</span>
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

        {/* ── Nav ── */}
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
                              background: 'rgba(99,102,241,0.15)',
                              border: '1px solid rgba(99,102,241,0.3)',
                              color: '#a5b4fc',
                              boxShadow: '0 0 20px rgba(99,102,241,0.1)',
                            }
                          : {
                              background: 'transparent',
                              border: '1px solid transparent',
                              color: 'rgba(255,255,255,0.4)',
                            }
                      }
                    >
                      <Link href={href} className='flex items-center gap-3'>
                        <Icon
                          size={16}
                          style={{
                            color: isActive
                              ? '#818cf8'
                              : 'rgba(255,255,255,0.3)',
                          }}
                        />
                        <span>{label}</span>
                        {isActive && (
                          <span
                            className='ml-auto h-1.5 w-1.5 rounded-full'
                            style={{
                              background: '#818cf8',
                              boxShadow: '0 0 6px #818cf8',
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
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 1 }}
        >
          <div
            className='flex items-center gap-2 rounded-xl p-2'
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Avatar */}
            <div
              className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black'
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
              }}
            >
              {user?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>

            {/* Name + email */}
            <div className='min-w-0 flex-1'>
              <p
                className='truncate text-xs font-semibold'
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {user?.fullName ?? '—'}
              </p>
              <p
                className='truncate text-[10px]'
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {user?.email ?? ''}
              </p>
            </div>

            {/* Theme toggle */}
            <button
              type='button'
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/10'
              style={{ color: 'rgba(255,255,255,0.4)' }}
              aria-label='Toggle theme'
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Logout */}
            <button
              type='button'
              onClick={handleLogout}
              className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 hover:bg-red-500/15'
              style={{ color: 'rgba(255,255,255,0.4)' }}
              aria-label='Sign out'
            >
              <LogOut size={13} />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* ── Main ── */}
      <SidebarInset
        className='flex flex-col overflow-hidden'
        style={{ background: '#06060f' }}
      >
        <main className='flex-1 overflow-y-auto'>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

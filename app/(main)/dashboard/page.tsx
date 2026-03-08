'use client';

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Search,
  Ticket,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/**
 * @module DashboardPage
 *
 * All colours come from --app-* CSS tokens defined in globals.css.
 * To change anything visually: edit globals.css only — never touch this file.
 *
 * Reusable patterns used here:
 *   .glass-card        — translucent surface card
 *   .card-accent-line  — top cyan/indigo gradient line
 *   .app-mesh          — animated blob + dot-grid background
 *   .badge-*           — status badge (open / progress / pending / closed)
 *   .dot-*             — priority and health indicator dots
 */

function useCountUp(target: number, duration = 1600) {
  const [v, setV] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const s = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - s) / duration, 1);
      setV(Math.floor((1 - (1 - p) ** 4) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return v;
}

function StatCard({
  title,
  value,
  display,
  change,
  icon: Icon,
  invertChange,
  accentVar,
  delay,
}: {
  title: string;
  value: number;
  display?: string;
  change: number;
  icon: React.ElementType;
  invertChange?: boolean;
  accentVar: string; // e.g. 'var(--app-stat-open)'
  delay: number;
}) {
  const counted = useCountUp(value);
  const isGood = invertChange ? change < 0 : change > 0;

  return (
    <div
      className='animate-fade-in-up opacity-0 group relative cursor-default'
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Hover glow blob */}
      <div
        className='absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl'
        style={{
          background: accentVar,
          transform: 'scale(0.85) translateY(8px)',
        }}
      />

      <div
        className='relative overflow-hidden rounded-[20px] p-6 transition-transform duration-300 group-hover:-translate-y-1'
        style={{
          background: 'var(--app-surface)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--app-border)',
        }}
      >
        {/* Corner glow */}
        <div
          className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl'
          style={{ background: accentVar }}
        />
        {/* Top accent line */}
        <div
          className='absolute inset-x-0 top-0 h-px'
          style={{
            background: `linear-gradient(90deg, transparent, ${accentVar}, transparent)`,
          }}
        />

        <div className='flex items-start justify-between'>
          <p
            className='text-[11px] font-bold uppercase tracking-[0.12em]'
            style={{ color: 'var(--app-text-muted)' }}
          >
            {title}
          </p>
          <div
            className='flex h-9 w-9 items-center justify-center rounded-xl'
            style={{
              background: `color-mix(in srgb, ${accentVar} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accentVar} 35%, transparent)`,
            }}
          >
            <Icon size={15} style={{ color: accentVar }} />
          </div>
        </div>

        <div
          className='mt-4 text-[3.2rem] font-black leading-none tracking-tight'
          style={{ color: 'var(--app-text-primary)' }}
        >
          {display ?? counted.toLocaleString()}
        </div>

        <div className='mt-3 flex items-center gap-1.5'>
          {isGood ? (
            <ArrowUpRight
              size={13}
              style={{ color: 'var(--app-health-healthy)' }}
            />
          ) : (
            <ArrowDownRight
              size={13}
              style={{ color: 'var(--app-priority-critical)' }}
            />
          )}
          <span
            className='text-xs font-semibold'
            style={{
              color: isGood
                ? 'var(--app-health-healthy)'
                : 'var(--app-priority-critical)',
            }}
          >
            {change > 0 ? `+${change}` : change} vs last week
          </span>
        </div>
      </div>
    </div>
  );
}

const STATS = [
  {
    title: 'Open Tickets',
    value: 1552,
    change: 50,
    icon: Ticket,
    invertChange: true,
    accentVar: 'var(--app-stat-open)',
    delay: 100,
  },
  {
    title: 'Closed Tickets',
    value: 4550,
    change: 120,
    icon: CheckCircle2,
    invertChange: false,
    accentVar: 'var(--app-stat-closed)',
    delay: 180,
  },
  {
    title: 'Total Users',
    value: 1200,
    change: 10,
    icon: Users,
    invertChange: false,
    accentVar: 'var(--app-stat-users)',
    delay: 260,
  },
  {
    title: 'Avg Resolution',
    value: 45,
    display: '4.5h',
    change: -0.5,
    icon: Clock,
    invertChange: true,
    accentVar: 'var(--app-stat-resolution)',
    delay: 340,
  },
];

const TICKETS = [
  {
    id: 'TK-091',
    title: 'VPN not connecting after update',
    priority: 'high',
    status: 'open',
    time: '10m ago',
  },
  {
    id: 'TK-090',
    title: 'Outlook keeps crashing on startup',
    priority: 'medium',
    status: 'open',
    time: '34m ago',
  },
  {
    id: 'TK-089',
    title: 'New laptop setup required',
    priority: 'low',
    status: 'in-progress',
    time: '1h ago',
  },
  {
    id: 'TK-088',
    title: 'Printer offline in room 204',
    priority: 'medium',
    status: 'in-progress',
    time: '2h ago',
  },
  {
    id: 'TK-087',
    title: 'Password reset request',
    priority: 'low',
    status: 'closed',
    time: '3h ago',
  },
];

const HEALTH = [
  {
    name: 'Active Directory',
    status: 'healthy',
    uptime: '99.9%',
    latency: '12ms',
  },
  { name: 'Email Server', status: 'healthy', uptime: '99.7%', latency: '45ms' },
  { name: 'VPN Gateway', status: 'warning', uptime: '97.2%', latency: '210ms' },
  { name: 'File Server', status: 'healthy', uptime: '100%', latency: '8ms' },
  { name: 'Backup Service', status: 'error', uptime: '89.1%', latency: '—' },
];

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-open',
  'in-progress': 'badge-progress',
  closed: 'badge-closed',
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'dot-high',
  medium: 'dot-medium',
  low: 'dot-low',
};

const HEALTH_DOT: Record<string, string> = {
  healthy: 'dot-healthy',
  warning: 'dot-warning',
  error: 'dot-error',
};

const QUICK_ACTIONS = [
  { href: '/users/new', icon: UserPlus, label: 'Add User' },
  { href: '/knowledge-base/new', icon: FileText, label: 'Write Article' },
  { href: '/tickets', icon: Search, label: 'Search Tickets' },
  { href: '/activity-logs', icon: Activity, label: 'View Logs' },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h >= 5 && h < 12
        ? 'Good morning'
        : h >= 12 && h < 17
          ? 'Good afternoon'
          : h >= 17 && h < 21
            ? 'Good evening'
            : 'Good night',
    );
  }, []);

  return (
    <div
      className='relative min-h-screen'
      style={{ background: 'var(--app-bg)' }}
    >
      {/* ── Mesh background ── */}
      <div
        className='app-mesh pointer-events-none fixed inset-0'
        style={{ zIndex: 0 }}
      />

      {/* ── Content ── */}
      <div className='relative space-y-8 p-8' style={{ zIndex: 1 }}>
        {/* ── Header ── */}
        <div
          className='animate-fade-in-up opacity-0 flex items-start justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <div className='flex items-center gap-3 mb-1'>
              <div
                className='flex h-8 w-8 items-center justify-center rounded-lg'
                style={{
                  background: 'var(--app-accent-dim)',
                  border: '1px solid var(--app-accent-border)',
                }}
              >
                <Zap size={14} style={{ color: 'var(--app-accent-text)' }} />
              </div>
              <span
                className='text-xs font-semibold uppercase tracking-widest'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Operations Center
              </span>
            </div>

            <h1 className='text-5xl font-black tracking-tight leading-tight'>
              <span className='text-gradient-primary'>{greeting},&nbsp;</span>
              <span className='text-gradient-accent'>
                {userLoading ? '…' : (user?.fullName ?? '—')}
              </span>
              <span style={{ color: 'var(--app-text-primary)' }}> 👋</span>
            </h1>

            <p
              className='mt-2 text-sm'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Here&apos;s what&apos;s happening in your IT environment today.
            </p>
          </div>

          {/* Live pill */}
          <div
            className='flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold'
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text-secondary)',
            }}
          >
            <span className='h-2 w-2 rounded-full dot-healthy animate-pulse-glow' />
            Live
          </div>
        </div>

        {/* ── Stats ── */}
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          {STATS.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        {/* ── Middle row ── */}
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
          {/* Recent Tickets */}
          <div
            className='glass-card animate-fade-in-up opacity-0 lg:col-span-2'
            style={{ animationDelay: '420ms', animationFillMode: 'forwards' }}
          >
            <div className='card-accent-line' />
            <div
              className='flex items-center justify-between px-6 py-4'
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <div>
                <p
                  className='text-sm font-bold'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  Recent Tickets
                </p>
                <p
                  className='text-xs'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Latest activity across your helpdesk
                </p>
              </div>
              <a
                href='/tickets'
                className='flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all'
                style={{
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-accent-text)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--app-accent-dim)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                View all <ArrowUpRight size={11} />
              </a>
            </div>

            {TICKETS.map((t, i) => (
              <div
                key={t.id}
                className='flex items-center gap-4 px-6 py-3.5 transition-all duration-200 hover:bg-(--app-surface-raised)'
                style={{
                  borderBottom:
                    i < TICKETS.length - 1
                      ? '1px solid var(--app-border)'
                      : 'none',
                }}
              >
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`}
                />
                <span
                  className='font-mono text-[11px] font-bold'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  {t.id}
                </span>
                <span
                  className='flex-1 truncate text-sm font-medium'
                  style={{ color: 'var(--app-text-secondary)' }}
                >
                  {t.title}
                </span>
                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[t.status]}`}
                >
                  {t.status}
                </span>
                <span
                  className='shrink-0 text-xs'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  {t.time}
                </span>
              </div>
            ))}
          </div>

          {/* System Health */}
          <div
            className='glass-card animate-fade-in-up opacity-0'
            style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
          >
            <div className='card-accent-line' />
            <div
              className='px-6 py-4'
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <p
                className='text-sm font-bold'
                style={{ color: 'var(--app-text-primary)' }}
              >
                System Health
              </p>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                Live status of core services
              </p>
            </div>
            {HEALTH.map((svc, i) => (
              <div
                key={svc.name}
                className='flex items-center justify-between px-6 py-3.5'
                style={{
                  borderBottom:
                    i < HEALTH.length - 1
                      ? '1px solid var(--app-border)'
                      : 'none',
                }}
              >
                <div className='flex items-center gap-3'>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${HEALTH_DOT[svc.status]}`}
                  />
                  <span
                    className='text-xs font-medium'
                    style={{ color: 'var(--app-text-secondary)' }}
                  >
                    {svc.name}
                  </span>
                </div>
                <div className='flex items-center gap-2.5'>
                  <span
                    className='text-[11px]'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    {svc.uptime}
                  </span>
                  <span
                    className='text-[11px] font-black tabular-nums'
                    style={{ color: `var(--app-health-${svc.status})` }}
                  >
                    {svc.latency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div
          className='glass-card animate-fade-in-up opacity-0'
          style={{ animationDelay: '580ms', animationFillMode: 'forwards' }}
        >
          <div className='card-accent-line' />
          <div
            className='px-6 py-4'
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Quick Actions
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Common tasks at your fingertips
            </p>
          </div>
          <div className='flex flex-wrap gap-3 px-6 py-5'>
            <a
              href='/tickets/new'
              className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90'
              style={{
                background: 'var(--app-accent)',
                color: 'var(--primary-foreground)',
                boxShadow: '0 4px 20px var(--app-accent-dim)',
              }}
            >
              <Plus size={14} /> New Ticket
            </a>
            {QUICK_ACTIONS.map(({ href, icon: Icon, label }) => (
              <a
                key={href}
                href={href}
                className='flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5'
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'var(--app-surface-raised)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--app-surface)';
                }}
              >
                <Icon size={14} /> {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

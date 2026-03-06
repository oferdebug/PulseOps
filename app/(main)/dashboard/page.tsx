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

// ─── Count-up ─────────────────────────────────────────────────────────────────
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

// ─── Glass Card ───────────────────────────────────────────────────────────────
function GlassCard({
  children,
  className = '',
  style = {},
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <div
      className={`animate-fade-in-up opacity-0 ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  display,
  change,
  icon: Icon,
  invertChange,
  accent,
  delay,
}: {
  title: string;
  value: number;
  display?: string;
  change: number;
  icon: React.ElementType;
  invertChange?: boolean;
  accent: string;
  delay: number;
}) {
  const counted = useCountUp(value);
  const isGood = invertChange ? change < 0 : change > 0;

  return (
    <div
      className='animate-fade-in-up opacity-0 group relative cursor-default'
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Glow behind card */}
      <div
        className='absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl'
        style={{ background: accent, transform: 'scale(0.85) translateY(8px)' }}
      />

      <div
        className='relative overflow-hidden rounded-[20px] p-6 transition-transform duration-300 group-hover:-translate-y-1'
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Corner glow */}
        <div
          className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl'
          style={{ background: accent }}
        />

        {/* Top accent line */}
        <div
          className='absolute inset-x-0 top-0 h-px'
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />

        <div className='flex items-start justify-between'>
          <p
            className='text-[11px] font-bold uppercase tracking-[0.12em]'
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {title}
          </p>
          <div
            className='flex h-9 w-9 items-center justify-center rounded-xl'
            style={{
              background: `${accent}25`,
              border: `1px solid ${accent}50`,
            }}
          >
            <Icon size={15} style={{ color: accent }} />
          </div>
        </div>

        <div
          className='mt-4 text-[3.2rem] font-black leading-none tracking-tight'
          style={{ color: '#fff' }}
        >
          {display ?? counted.toLocaleString()}
        </div>

        <div className='mt-3 flex items-center gap-1.5'>
          {isGood ? (
            <ArrowUpRight size={13} style={{ color: '#4ade80' }} />
          ) : (
            <ArrowDownRight size={13} style={{ color: '#f87171' }} />
          )}
          <span
            className='text-xs font-semibold'
            style={{ color: isGood ? '#4ade80' : '#f87171' }}
          >
            {change > 0 ? `+${change}` : change} vs last week
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const STATS = [
  {
    title: 'Open Tickets',
    value: 1552,
    change: 50,
    icon: Ticket,
    invertChange: true,
    accent: '#f43f5e',
    delay: 100,
  },
  {
    title: 'Closed Tickets',
    value: 4550,
    change: 120,
    icon: CheckCircle2,
    invertChange: false,
    accent: '#22c55e',
    delay: 180,
  },
  {
    title: 'Total Users',
    value: 1200,
    change: 10,
    icon: Users,
    invertChange: false,
    accent: '#818cf8',
    delay: 260,
  },
  {
    title: 'Avg Resolution',
    value: 45,
    display: '4.5h',
    change: -0.5,
    icon: Clock,
    invertChange: true,
    accent: '#fb923c',
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

const PRIORITY_COLOR: Record<string, string> = {
  high: '#f43f5e',
  medium: '#fb923c',
  low: '#6b7280',
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  open: { bg: 'rgba(96,165,250,0.15)', color: '#93c5fd' },
  'in-progress': { bg: 'rgba(251,191,36,0.15)', color: '#fcd34d' },
  closed: { bg: 'rgba(74,222,128,0.15)', color: '#86efac' },
};
const HEALTH_COLOR: Record<string, string> = {
  healthy: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
};

const QUICK_ACTIONS = [
  { href: '/users/new', icon: UserPlus, label: 'Add User' },
  { href: '/knowledge-base/new', icon: FileText, label: 'Write Article' },
  { href: '/tickets', icon: Search, label: 'Search Tickets' },
  { href: '/activity-logs', icon: Activity, label: 'View Logs' },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useCurrentUser();
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
    <div className='relative min-h-screen' style={{ background: '#06060f' }}>
      {/* ── Mesh gradient background ── */}
      <div className='pointer-events-none fixed inset-0' style={{ zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '40vw',
            height: '40vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '30%',
            width: '50vw',
            height: '30vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(6,6,15,0.8) 100%)',
          }}
        />
      </div>

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
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.4)',
                }}
              >
                <Zap size={14} style={{ color: '#818cf8' }} />
              </div>
              <span
                className='text-xs font-semibold uppercase tracking-widest'
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Operations Center
              </span>
            </div>
            <h1 className='text-5xl font-black tracking-tight leading-tight'>
              <span
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.45))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {greeting},&nbsp;
              </span>
              <span
                style={{
                  background:
                    'linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #6366f1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {user?.fullName ?? '—'}
              </span>
              <span style={{ WebkitTextFillColor: 'initial' }}> 👋</span>
            </h1>
            <p
              className='mt-2 text-sm'
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Here&apos;s what&apos;s happening in your IT environment today.
            </p>
          </div>

          {/* Live pill */}
          <div
            className='flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold'
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <span
              className='h-2 w-2 rounded-full bg-emerald-400'
              style={{ boxShadow: '0 0 8px #4ade80' }}
            />
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
          <GlassCard className='lg:col-span-2' delay={420}>
            <div
              className='h-px'
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)',
              }}
            />
            <div
              className='flex items-center justify-between px-6 py-4'
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div>
                <p className='text-sm font-bold text-white'>Recent Tickets</p>
                <p
                  className='text-xs'
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Latest activity across your helpdesk
                </p>
              </div>
              <a
                href='/tickets'
                className='flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:bg-white/10'
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#a5b4fc',
                }}
              >
                View all <ArrowUpRight size={11} />
              </a>
            </div>

            {TICKETS.map((t, i) => {
              const ss = STATUS_STYLE[t.status];
              return (
                <div
                  key={t.id}
                  className='flex items-center gap-4 px-6 py-3.5 transition-all duration-200 hover:bg-white/3'
                  style={{
                    borderBottom:
                      i < TICKETS.length - 1
                        ? '1px solid rgba(255,255,255,0.04)'
                        : 'none',
                  }}
                >
                  <div
                    className='h-2 w-2 shrink-0 rounded-full'
                    style={{
                      background: PRIORITY_COLOR[t.priority],
                      boxShadow: `0 0 6px ${PRIORITY_COLOR[t.priority]}`,
                    }}
                  />
                  <span
                    className='font-mono text-[11px] font-bold'
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    {t.id}
                  </span>
                  <span
                    className='flex-1 truncate text-sm font-medium'
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    {t.title}
                  </span>
                  <span
                    className='shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold'
                    style={{ background: ss.bg, color: ss.color }}
                  >
                    {t.status}
                  </span>
                  <span
                    className='shrink-0 text-xs'
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    {t.time}
                  </span>
                </div>
              );
            })}
          </GlassCard>

          {/* System Health */}
          <GlassCard delay={500}>
            <div
              className='h-px'
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)',
              }}
            />
            <div
              className='px-6 py-4'
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className='text-sm font-bold text-white'>System Health</p>
              <p className='text-xs' style={{ color: 'rgba(255,255,255,0.3)' }}>
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
                      ? '1px solid rgba(255,255,255,0.04)'
                      : 'none',
                }}
              >
                <div className='flex items-center gap-3'>
                  <span
                    className='h-2.5 w-2.5 rounded-full'
                    style={{
                      background: HEALTH_COLOR[svc.status],
                      boxShadow: `0 0 8px ${HEALTH_COLOR[svc.status]}`,
                    }}
                  />
                  <span
                    className='text-xs font-medium'
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {svc.name}
                  </span>
                </div>
                <div className='flex items-center gap-2.5'>
                  <span
                    className='text-[11px]'
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {svc.uptime}
                  </span>
                  <span
                    className='text-[11px] font-black tabular-nums'
                    style={{ color: HEALTH_COLOR[svc.status] }}
                  >
                    {svc.latency}
                  </span>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>

        {/* ── Quick Actions ── */}
        <GlassCard delay={580}>
          <div
            className='h-px'
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)',
            }}
          />
          <div
            className='px-6 py-4'
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className='text-sm font-bold text-white'>Quick Actions</p>
            <p className='text-xs' style={{ color: 'rgba(255,255,255,0.3)' }}>
              Common tasks at your fingertips
            </p>
          </div>
          <div className='flex flex-wrap gap-3 px-6 py-5'>
            <a
              href='/tickets/new'
              className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90'
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow:
                  '0 4px 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <Plus size={14} /> New Ticket
            </a>

            {QUICK_ACTIONS.map(({ href, icon: Icon, label }) => (
              <a
                key={href}
                href={href}
                className='flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/8'
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                <Icon size={14} /> {label}
              </a>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

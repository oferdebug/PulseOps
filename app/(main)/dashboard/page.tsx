'use client';

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Loader2,
  Plus,
  Search,
  Ticket,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';



// ── Animated count-up ───────────────────────────────────────────────────────
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

// ── Live clock ──────────────────────────────────────────────────────────────
function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  display,
  change,
  icon: Icon,
  invertChange,
  accentVar,
  delay,
  sparkData,
}: {
  title: string;
  value: number;
  display?: string;
  change: number;
  icon: React.ElementType;
  invertChange?: boolean;
  accentVar: string;
  delay: number;
  sparkData?: number[];
}) {
  const counted = useCountUp(value);
  const isGood = invertChange ? change < 0 : change > 0;

  return (
    <div
      className='animate-fade-in-up opacity-0'
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div
        className='overflow-hidden rounded-xl hover-lift'
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          boxShadow: 'var(--app-shadow-md)',
        }}
      >
        {/* Colored top accent */}
        <div
          className='h-1'
          style={{
            background: accentVar.includes('var(') ? 'var(--app-accent)' : accentVar,
          }}
        />
        <div className='p-5'>

        <div className='flex items-start justify-between'>
          <p
            className='text-xs font-medium'
            style={{ color: 'var(--app-text-muted)' }}
          >
            {title}
          </p>
          <div
            className='flex h-9 w-9 items-center justify-center rounded-lg'
            style={{
              background: `color-mix(in srgb, ${accentVar} 15%, transparent)`,
            }}
          >
            <Icon size={16} style={{ color: accentVar }} />
          </div>
        </div>

        <div
          className='mt-3 text-3xl font-bold leading-none tracking-tight'
          style={{ color: 'var(--app-text-primary)' }}
        >
          {display ?? counted.toLocaleString()}
        </div>

        {/* Sparkline */}
        {sparkData && sparkData.length > 1 && (
          <div className='mt-2 h-8 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={sparkData.map((v, i) => ({ i, v }))}>
                <defs>
                  <linearGradient
                    id={`spark-${title.replace(/\s/g, '')}`}
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop
                      offset='0%'
                      stopColor={
                        accentVar.includes('var(') ? '#10b981' : accentVar
                      }
                      stopOpacity={0.4}
                    />
                    <stop
                      offset='100%'
                      stopColor={
                        accentVar.includes('var(') ? '#10b981' : accentVar
                      }
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type='monotone'
                  dataKey='v'
                  stroke={accentVar.includes('var(') ? '#10b981' : accentVar}
                  strokeWidth={1.5}
                  fill={`url(#spark-${title.replace(/\s/g, '')})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className='mt-2 flex items-center gap-1.5'>
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
      </div>{/* end padding wrapper */}
      </div>
    </div>
  );
}

// ── Radial Gauge (CSS-only) ─────────────────────────────────────────────────
function RadialGauge({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='relative h-32 w-32'>
        <svg
          viewBox='0 0 120 120'
          className='h-full w-full -rotate-90'
          role='img'
          aria-label={`${label}: ${clamped}%`}
        >
          <title>
            {label}: {clamped}%
          </title>
          <circle
            cx='60'
            cy='60'
            r='54'
            fill='none'
            stroke='var(--app-border)'
            strokeWidth='8'
          />
          <circle
            cx='60'
            cy='60'
            r='54'
            fill='none'
            stroke={color}
            strokeWidth='8'
            strokeLinecap='round'
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition:
                'stroke-dashoffset 1.5s cubic-bezier(0.35, 0, 0.25, 1)',
            }}
          />
        </svg>
        <div className='absolute inset-0 flex items-center justify-center'>
          <span
            className='text-2xl font-bold'
            style={{ color: 'var(--app-text-primary)' }}
          >
            {clamped}%
          </span>
        </div>
      </div>
      <span
        className='text-xs font-medium'
        style={{ color: 'var(--app-text-muted)' }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Constants ───────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  open: '#f59e0b',
  in_progress: '#6366f1',
  pending: '#f97316',
  closed: '#22c55e',
};

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-open',
  in_progress: 'badge-progress',
  pending: 'badge-pending',
  closed: 'badge-closed',
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'dot-high',
  medium: 'dot-medium',
  low: 'dot-low',
  critical: 'dot-critical',
};

const HEALTH_DOT: Record<string, string> = {
  healthy: 'dot-healthy',
  warning: 'dot-warning',
  error: 'dot-error',
};

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

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Search' },
  { keys: ['⌘', 'N'], label: 'New Ticket' },
  { keys: ['⌘', 'B'], label: 'Toggle Sidebar' },
];

// ── Data Types ──────────────────────────────────────────────────────────────
interface DashboardStats {
  openTickets: number;
  closedTickets: number;
  totalUsers: number;
  avgResolutionHours: number;
  changes: {
    openTickets: number;
    closedTickets: number;
    totalUsers: number;
    avgResolutionHours: number;
  };
  statusBreakdown: { name: string; value: number }[];
  dailyCounts: number[];
  topClosers: { name: string; count: number }[];
  slaCompliance: number;
  urgentTicket: {
    id: string;
    title: string;
    priority: string;
    created_at: string;
  } | null;
  heatmapData: { date: string; count: number }[];
}

interface RecentTicket {
  id: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
}

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  description: string | null;
  user_email: string;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Data Hook ───────────────────────────────────────────────────────────────
function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<RecentTicket[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [ticketsRes, usersRes, usersLastWeekRes, activityRes] =
      await Promise.all([
        supabase
          .from('tickets')
          .select(
            'id, title, status, priority, created_at, updated_at, assigned_to',
          ),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .lt('created_at', oneWeekAgo),
        supabase
          .from('activity_logs')
          .select('id, action, entity, description, user_email, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

    const allTickets = ticketsRes.data ?? [];

    // ── Core stats ──
    const openTickets = allTickets.filter((t) => t.status !== 'closed').length;
    const closedTickets = allTickets.filter((t) => t.status === 'closed');

    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();

    const ticketsLastWeek = allTickets.filter((t) => {
      const created = new Date(t.created_at).getTime();
      return (
        created >= Date.now() - 14 * 86400000 &&
        created < Date.now() - 7 * 86400000
      );
    });
    const openLastWeek = ticketsLastWeek.filter(
      (t) => t.status !== 'closed',
    ).length;
    const closedLastWeek = ticketsLastWeek.filter(
      (t) =>
        t.status === 'closed' &&
        new Date(t.updated_at).getTime() < Date.now() - 7 * 86400000,
    ).length;

    let avgResolutionHours = 0;
    if (closedTickets.length > 0) {
      const totalHours = closedTickets.reduce((sum, t) => {
        return (
          sum +
          (new Date(t.updated_at).getTime() -
            new Date(t.created_at).getTime()) /
            3600000
        );
      }, 0);
      avgResolutionHours =
        Math.round((totalHours / closedTickets.length) * 10) / 10;
    }

    const closedLastWeekTickets = allTickets.filter(
      (t) =>
        t.status === 'closed' &&
        t.created_at < oneWeekAgo &&
        t.updated_at < oneWeekAgo,
    );
    let avgResLastWeek = 0;
    if (closedLastWeekTickets.length > 0) {
      const hrs = closedLastWeekTickets.reduce(
        (sum, t) =>
          sum +
          (new Date(t.updated_at).getTime() -
            new Date(t.created_at).getTime()) /
            3600000,
        0,
      );
      avgResLastWeek =
        Math.round((hrs / closedLastWeekTickets.length) * 10) / 10;
    }

    const totalUsers = usersRes.count ?? 0;
    const usersLastWeek = usersLastWeekRes.count ?? 0;

    // ── Status breakdown for donut ──
    const statusCounts: Record<string, number> = {};
    for (const t of allTickets) {
      statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
    }
    const statusBreakdown = Object.entries(statusCounts).map(
      ([name, value]) => ({ name, value }),
    );

    // ── Daily counts for sparkline (last 7 days) ──
    const dailyCounts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = allTickets.filter((t) => {
        const d = new Date(t.created_at).getTime();
        return d >= dayStart.getTime() && d < dayEnd.getTime();
      }).length;
      dailyCounts.push(count);
    }

    // ── Top closers (by assigned_to on closed tickets) ──
    const closerMap: Record<string, number> = {};
    for (const t of closedTickets) {
      if (t.assigned_to)
        closerMap[t.assigned_to] = (closerMap[t.assigned_to] ?? 0) + 1;
    }
    const closerIds = Object.entries(closerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    let topClosers: { name: string; count: number }[] = [];
    if (closerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in(
          'id',
          closerIds.map(([id]) => id),
        );

      const nameMap: Record<string, string> = {};
      for (const p of profiles ?? []) {
        nameMap[p.id] = p.full_name?.trim() || p.email || p.id.slice(0, 8);
      }
      topClosers = closerIds.map(([id, count]) => ({
        name: nameMap[id] ?? id.slice(0, 8),
        count,
      }));
    }

    // ── SLA compliance (% closed within 24h) ──
    const slaCompliance =
      closedTickets.length > 0
        ? Math.round(
            (closedTickets.filter((t) => {
              const hrs =
                (new Date(t.updated_at).getTime() -
                  new Date(t.created_at).getTime()) /
                3600000;
              return hrs <= 24;
            }).length /
              closedTickets.length) *
              100,
          )
        : 100;

    // ── Urgent ticket (oldest open critical/high) ──
    const urgentTicket =
      allTickets
        .filter(
          (t) =>
            t.status !== 'closed' &&
            (t.priority === 'critical' || t.priority === 'high'),
        )
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )[0] ?? null;

    // ── Heatmap data (last 90 days) ──
    const heatmapData: { date: string; count: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const cnt = allTickets.filter((t) => {
        const ts = new Date(t.created_at).getTime();
        return ts >= dayStart.getTime() && ts < dayEnd.getTime();
      }).length;
      heatmapData.push({
        date: dayStart.toISOString().slice(0, 10),
        count: cnt,
      });
    }

    setStats({
      openTickets,
      closedTickets: closedTickets.length,
      totalUsers,
      avgResolutionHours,
      changes: {
        openTickets: openTickets - openLastWeek,
        closedTickets: closedTickets.length - closedLastWeek,
        totalUsers: totalUsers - usersLastWeek,
        avgResolutionHours:
          Math.round((avgResolutionHours - avgResLastWeek) * 10) / 10,
      },
      statusBreakdown,
      dailyCounts,
      topClosers,
      slaCompliance,
      urgentTicket: urgentTicket
        ? {
            id: urgentTicket.id,
            title: urgentTicket.title,
            priority: urgentTicket.priority,
            created_at: urgentTicket.created_at,
          }
        : null,
      heatmapData,
    });

    // Recent tickets
    const { data: recent } = await supabase
      .from('tickets')
      .select('id, title, priority, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    setTickets(recent ?? []);

    // Activity
    setActivities((activityRes.data ?? []) as ActivityItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, tickets, activities, loading, refresh: load };
}

const ACTION_ICONS: Record<string, string> = {
  created: '🆕',
  updated: '✏️',
  deleted: '🗑️',
  viewed: '👁️',
  logged_in: '🔑',
  logged_out: '👋',
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const {
    stats,
    tickets,
    activities,
    loading: dataLoading,
  } = useDashboardData();
  const [greeting, setGreeting] = useState('Good morning');
  const clock = useLiveClock();

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

  const formattedDate = clock.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = clock.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className='min-h-screen'
      style={{ background: 'var(--app-bg)' }}
    >
      <div className='space-y-6 p-6'>
        {/* ── Header ── */}
        <div
          className='animate-fade-in-up opacity-0 flex items-start justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              <span style={{ color: 'var(--app-text-primary)' }}>{greeting}, </span>
              <span style={{ color: 'var(--app-accent)' }}>
                {userLoading ? '…' : (user?.fullName ?? '—')}
              </span>
              <span className='ml-1'>👋</span>
            </h1>

            <p
              className='mt-2 text-sm'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Here&apos;s what&apos;s happening in your IT environment today.
            </p>
          </div>

          {/* Right side: live clock + indicator */}
          <div className='flex flex-col items-end gap-2'>
            <div
              className='flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium'
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-secondary)',
                boxShadow: 'var(--app-shadow-sm)',
              }}
            >
              <span className='h-2 w-2 rounded-full dot-healthy' />
              Live
            </div>
            <div className='text-right'>
              <p
                className='text-xl font-bold tabular-nums tracking-tight'
                style={{ color: 'var(--app-text-primary)' }}
              >
                {formattedTime}
              </p>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                {formattedDate}
              </p>
            </div>
          </div>
        </div>

        {/* ── Command Bar (Quick Actions + Shortcuts) ── */}
        <div
          className='animate-fade-in-up opacity-0 flex items-center gap-3 rounded-xl px-4 py-2.5'
          style={{
            animationDelay: '50ms',
            animationFillMode: 'forwards',
            background: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            boxShadow: 'var(--app-shadow-sm)',
          }}
        >
          <Link
            href='/tickets/new'
            className='flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 hover:opacity-90'
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Plus size={14} /> New Ticket
          </Link>
          <div
            className='mx-1 h-6 w-px'
            style={{ background: 'var(--app-border)' }}
          />
          {[
            { href: '/users/new', icon: UserPlus, label: 'Add User' },
            {
              href: '/knowledge-base/new',
              icon: FileText,
              label: 'Write Article',
            },
            { href: '/tickets', icon: Search, label: 'Search Tickets' },
            { href: '/activity-logs', icon: Activity, label: 'View Logs' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className='flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:bg-(--app-surface-raised)'
              style={{ color: 'var(--app-text-secondary)' }}
            >
              <Icon size={13} /> {label}
            </Link>
          ))}
          <div className='ml-auto flex items-center gap-3'>
            {SHORTCUTS.map((s) => (
              <div key={s.label} className='flex items-center gap-1'>
                <span
                  className='text-[10px] font-medium'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  {s.label}
                </span>
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className='flex h-5 min-w-[20px] items-center justify-center rounded px-1 text-[9px] font-bold'
                    style={{
                      background: 'var(--app-surface-raised)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-text-muted)',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Urgent Focus Banner ── */}
        {stats?.urgentTicket && (
          <Link
            href={`/tickets/${stats.urgentTicket.id}`}
            className='animate-fade-in-up opacity-0 flex items-center gap-3 rounded-lg px-4 py-3 transition-colors duration-200 group'
            style={{
              animationDelay: '80ms',
              animationFillMode: 'forwards',
              background:
                stats.urgentTicket.priority === 'critical'
                  ? 'color-mix(in srgb, #ef4444 10%, var(--app-surface))'
                  : 'color-mix(in srgb, #f59e0b 10%, var(--app-surface))',
              border: `1px solid ${stats.urgentTicket.priority === 'critical' ? 'color-mix(in srgb, #ef4444 25%, var(--app-border))' : 'color-mix(in srgb, #f59e0b 25%, var(--app-border))'}`,
            }}
          >
            <div
              className='flex h-8 w-8 items-center justify-center rounded-md'
              style={{
                background:
                  stats.urgentTicket.priority === 'critical'
                    ? 'color-mix(in srgb, #ef4444 15%, transparent)'
                    : 'color-mix(in srgb, #f59e0b 15%, transparent)',
              }}
            >
              <AlertTriangle
                size={15}
                style={{
                  color:
                    stats.urgentTicket.priority === 'critical'
                      ? '#ef4444'
                      : '#f59e0b',
                }}
              />
            </div>
            <div className='flex-1 min-w-0'>
              <p
                className='text-xs font-bold uppercase tracking-wider'
                style={{
                  color:
                    stats.urgentTicket.priority === 'critical'
                      ? '#ef4444'
                      : '#f59e0b',
                }}
              >
                Needs Attention —{' '}
                {stats.urgentTicket.priority === 'critical'
                  ? 'Critical'
                  : 'High'}{' '}
                Priority
              </p>
              <p
                className='text-sm font-medium truncate group-hover:underline'
                style={{ color: 'var(--app-text-primary)' }}
              >
                {stats.urgentTicket.title}
              </p>
            </div>
            <span
              className='text-xs font-medium whitespace-nowrap'
              style={{ color: 'var(--app-text-muted)' }}
            >
              {timeAgo(stats.urgentTicket.created_at)}
            </span>
          </Link>
        )}

        {/* ── Stats row ── */}
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          {stats ? (
            <>
              <StatCard
                title='Open Tickets'
                value={stats.openTickets}
                change={stats.changes.openTickets}
                icon={Ticket}
                invertChange
                accentVar='var(--app-stat-open)'
                delay={100}
                sparkData={stats.dailyCounts}
              />
              <StatCard
                title='Closed Tickets'
                value={stats.closedTickets}
                change={stats.changes.closedTickets}
                icon={CheckCircle2}
                accentVar='var(--app-stat-closed)'
                delay={180}
              />
              <StatCard
                title='Total Users'
                value={stats.totalUsers}
                change={stats.changes.totalUsers}
                icon={Users}
                accentVar='var(--app-stat-users)'
                delay={260}
              />
              <StatCard
                title='Avg Resolution'
                value={stats.avgResolutionHours}
                display={`${stats.avgResolutionHours}h`}
                change={stats.changes.avgResolutionHours}
                icon={Clock}
                invertChange
                accentVar='var(--app-stat-resolution)'
                delay={340}
              />
            </>
          ) : (
            <>                {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className='overflow-hidden rounded-xl'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                  }}
                >
                  <Skeleton className='h-1 w-full' />
                  <div className='p-5 space-y-3'>
                    <div className='flex items-start justify-between'>
                      <Skeleton className='h-3 w-20' />
                      <Skeleton className='h-9 w-9 rounded-lg' />
                    </div>
                    <Skeleton className='h-8 w-24' />
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-3 w-28' />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Middle row: Tickets + Donut + SLA ── */}
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
          {/* Recent Tickets — 6 cols */}
          <div
            className='glass-card animate-fade-in-up opacity-0 lg:col-span-6'
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
              <Link
                href='/tickets'
                className='flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-(--app-accent-dim)'
                style={{
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-accent-text)',
                }}
              >
                View all <ArrowUpRight size={11} />
              </Link>
            </div>
            {dataLoading ? (
              <div className='flex justify-center py-8'>
                <Loader2
                  size={16}
                  className='animate-spin'
                  style={{ color: 'var(--app-text-faint)' }}
                />
              </div>
            ) : tickets.length === 0 ? (
              <div
                className='py-8 text-center text-xs'
                style={{ color: 'var(--app-text-faint)' }}
              >
                No tickets yet
              </div>
            ) : (
              tickets.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  className='flex items-center gap-4 px-6 py-3.5 transition-all duration-200 hover:bg-(--app-surface-raised)'
                  style={{
                    borderBottom:
                      i < tickets.length - 1
                        ? '1px solid var(--app-border)'
                        : 'none',
                  }}
                >
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority] ?? ''}`}
                  />
                  <span
                    className='font-mono text-[11px] font-bold'
                    style={{ color: 'var(--app-text-faint)' }}
                  >
                    {t.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    className='flex-1 truncate text-sm font-medium'
                    style={{ color: 'var(--app-text-secondary)' }}
                  >
                    {t.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[t.status] ?? ''}`}
                  >
                    {t.status.replace(/_/g, ' ')}
                  </span>
                  <span
                    className='shrink-0 text-xs'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    {timeAgo(t.created_at)}
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Ticket Distribution Donut — 3 cols */}
          <div
            className='glass-card animate-fade-in-up opacity-0 lg:col-span-3'
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
                Ticket Distribution
              </p>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                By status
              </p>
            </div>
            <div className='flex flex-col items-center px-6 py-6'>
              {stats && stats.statusBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={stats.statusBreakdown}
                        cx='50%'
                        cy='50%'
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey='value'
                        stroke='none'
                      >
                        {stats.statusBreakdown.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name] ?? '#6366f1'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--app-surface)',
                          border: '1px solid var(--app-border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'var(--app-text-primary)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className='mt-3 flex flex-wrap justify-center gap-3'>
                    {stats.statusBreakdown.map((s) => (
                      <div key={s.name} className='flex items-center gap-1.5'>
                        <span
                          className='h-2 w-2 rounded-full'
                          style={{
                            background: STATUS_COLORS[s.name] ?? '#6366f1',
                          }}
                        />
                        <span
                          className='text-[10px] font-semibold capitalize'
                          style={{ color: 'var(--app-text-muted)' }}
                        >
                          {s.name.replace(/_/g, ' ')} ({s.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p
                  className='py-8 text-xs'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  No data yet
                </p>
              )}
            </div>
          </div>

          {/* SLA + Performance — 3 cols */}
          <div
            className='glass-card animate-fade-in-up opacity-0 lg:col-span-3'
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
                SLA Compliance
              </p>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                Resolved within 24h target
              </p>
            </div>
            <div className='flex flex-col items-center px-6 py-6'>
              {stats ? (
                <RadialGauge
                  value={stats.slaCompliance}
                  label='On-time rate'
                  color={
                    stats.slaCompliance >= 80
                      ? '#22c55e'
                      : stats.slaCompliance >= 50
                        ? '#f59e0b'
                        : '#ef4444'
                  }
                />
              ) : (
                <Loader2
                  size={16}
                  className='animate-spin'
                  style={{ color: 'var(--app-text-faint)' }}
                />
              )}
              <div className='mt-4 w-full space-y-2'>
                <div className='flex items-center justify-between'>
                  <span
                    className='text-[11px] font-semibold'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    First Response
                  </span>
                  <span
                    className='text-[11px] font-bold'
                    style={{ color: 'var(--app-health-healthy)' }}
                  >
                    {stats
                      ? `${Math.max(1, Math.round(stats.avgResolutionHours * 0.15))}h avg`
                      : '—'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span
                    className='text-[11px] font-semibold'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Resolution
                  </span>
                  <span
                    className='text-[11px] font-bold'
                    style={{ color: 'var(--app-stat-resolution)' }}
                  >
                    {stats ? `${stats.avgResolutionHours}h avg` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom row: Activity + Health + Leaderboard ── */}
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
          {/* Activity Timeline — 5 cols */}
          <div
            className='glass-card animate-fade-in-up opacity-0 lg:col-span-5'
            style={{ animationDelay: '660ms', animationFillMode: 'forwards' }}
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
                Activity Feed
              </p>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                Real-time operations log
              </p>
            </div>
            {activities.length === 0 ? (
              <div
                className='py-8 text-center text-xs'
                style={{ color: 'var(--app-text-faint)' }}
              >
                No activity yet
              </div>
            ) : (
              <div className='relative'>
                {/* Timeline line */}
                <div
                  className='absolute left-8 top-0 bottom-0 w-px'
                  style={{ background: 'var(--app-border)' }}
                />
                {activities.map((a, i) => (
                  <div
                    key={a.id}
                    className='relative flex items-start gap-4 px-6 py-3'
                    style={{
                      borderBottom:
                        i < activities.length - 1
                          ? '1px solid var(--app-border)'
                          : 'none',
                    }}
                  >
                    <div
                      className='relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]'
                      style={{
                        background: 'var(--app-surface)',
                        border: '2px solid var(--app-border)',
                      }}
                    >
                      {ACTION_ICONS[a.action] ?? '•'}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p
                        className='truncate text-xs font-medium'
                        style={{ color: 'var(--app-text-secondary)' }}
                      >
                        {a.description ?? `${a.action} ${a.entity}`}
                      </p>
                      <p
                        className='text-[10px]'
                        style={{ color: 'var(--app-text-faint)' }}
                      >
                        {a.user_email} · {timeAgo(a.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Health — 4 cols */}
          <div
            className='glass-card animate-fade-in-up opacity-0 lg:col-span-4'
            style={{ animationDelay: '740ms', animationFillMode: 'forwards' }}
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
                    className='text-[11px] font-bold tabular-nums'
                    style={{ color: `var(--app-health-${svc.status})` }}
                  >
                    {svc.latency}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Team Leaderboard — 3 cols */}
          <div
            className='glass-card animate-fade-in-up opacity-0 lg:col-span-3'
            style={{ animationDelay: '820ms', animationFillMode: 'forwards' }}
          >
            <div className='card-accent-line' />
            <div
              className='px-6 py-4'
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <div className='flex items-center gap-2'>
                <Trophy size={13} style={{ color: '#f59e0b' }} />
                <p
                  className='text-sm font-bold'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  Top Closers
                </p>
              </div>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                Most tickets resolved
              </p>
            </div>
            {stats && stats.topClosers.length > 0 ? (
              stats.topClosers.map((closer, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                const maxCount = stats.topClosers[0]?.count ?? 1;
                const barWidth = Math.max(10, (closer.count / maxCount) * 100);
                return (
                  <div
                    key={closer.name}
                    className='px-6 py-3'
                    style={{
                      borderBottom:
                        i < stats.topClosers.length - 1
                          ? '1px solid var(--app-border)'
                          : 'none',
                    }}
                  >
                    <div className='flex items-center justify-between mb-1.5'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm'>
                          {medals[i] ?? (
                            <Flame
                              size={12}
                              style={{ color: 'var(--app-text-faint)' }}
                            />
                          )}
                        </span>
                        <span
                          className='text-xs font-semibold truncate max-w-[100px]'
                          style={{ color: 'var(--app-text-secondary)' }}
                        >
                          {closer.name}
                        </span>
                      </div>
                      <span
                        className='text-xs font-bold tabular-nums'
                        style={{ color: 'var(--app-accent-text)' }}
                      >
                        {closer.count}
                      </span>
                    </div>
                    <div
                      className='h-1 rounded-full overflow-hidden'
                      style={{ background: 'var(--app-border)' }}
                    >
                      <div
                        className='h-full rounded-full'
                        style={{
                          width: `${barWidth}%`,
                          background:
                            i === 0
                              ? '#f59e0b'
                              : i === 1
                                ? '#94a3b8'
                                : i === 2
                                  ? '#cd7f32'
                                  : 'var(--app-accent)',
                          transition: 'width 1s ease-out',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className='py-8 text-center text-xs'
                style={{ color: 'var(--app-text-faint)' }}
              >
                No resolved tickets yet
              </div>
            )}
          </div>
        </div>

        {/* ── Activity Heatmap (90-day) ── */}
        {stats && (
          <div
            className='glass-card animate-fade-in-up opacity-0'
            style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}
          >
            <div className='card-accent-line' />
            <div
              className='flex items-center justify-between px-6 py-4'
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <div className='flex items-center gap-2'>
                <CalendarDays
                  size={14}
                  style={{ color: 'var(--app-accent-text)' }}
                />
                <p
                  className='text-sm font-bold'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  Ticket Activity
                </p>
                <span
                  className='text-xs'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  — last 90 days
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span
                  className='text-[10px]'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  Less
                </span>
                {[0, 1, 2, 3, 4].map((lv) => (
                  <div
                    key={lv}
                    className='h-3 w-3 rounded-sm'
                    style={{
                      background:
                        lv === 0
                          ? 'var(--app-surface-raised)'
                          : lv === 1
                            ? 'color-mix(in srgb, var(--app-accent) 25%, transparent)'
                            : lv === 2
                              ? 'color-mix(in srgb, var(--app-accent) 50%, transparent)'
                              : lv === 3
                                ? 'color-mix(in srgb, var(--app-accent) 75%, transparent)'
                                : 'var(--app-accent)',
                    }}
                  />
                ))}
                <span
                  className='text-[10px]'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  More
                </span>
              </div>
            </div>
            <div className='overflow-x-auto px-6 py-5'>
              <div className='flex gap-[3px]'>
                {(() => {
                  const weeks: { date: string; count: number }[][] = [];
                  for (let i = 0; i < stats.heatmapData.length; i += 7) {
                    weeks.push(stats.heatmapData.slice(i, i + 7));
                  }
                  const max = Math.max(
                    ...stats.heatmapData.map((h) => h.count),
                    1,
                  );
                  return weeks.map((week) => (
                    <div key={week[0].date} className='flex flex-col gap-[3px]'>
                      {week.map((d) => {
                        const ratio = d.count / max;
                        const level =
                          d.count === 0
                            ? 0
                            : ratio <= 0.25
                              ? 1
                              : ratio <= 0.5
                                ? 2
                                : ratio <= 0.75
                                  ? 3
                                  : 4;
                        return (
                          <div
                            key={d.date}
                            title={`${d.date}: ${d.count} ticket${d.count !== 1 ? 's' : ''}`}
                            className='h-3.5 w-3.5 rounded-sm transition-all duration-200 hover:scale-125 hover:ring-1 hover:ring-white/30'
                            style={{
                              background:
                                level === 0
                                  ? 'var(--app-surface-raised)'
                                  : level === 1
                                    ? 'color-mix(in srgb, var(--app-accent) 25%, transparent)'
                                    : level === 2
                                      ? 'color-mix(in srgb, var(--app-accent) 50%, transparent)'
                                      : level === 3
                                        ? 'color-mix(in srgb, var(--app-accent) 75%, transparent)'
                                        : 'var(--app-accent)',
                            }}
                          />
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

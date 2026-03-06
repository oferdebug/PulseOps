'use client';

import {
  Activity,
  Eye,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type LogAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'viewed'
  | 'logged_in'
  | 'logged_out';
type LogEntity = 'ticket' | 'article' | 'user' | 'profile' | 'system';

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: LogAction;
  entity: LogEntity;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_LABELS: Record<LogAction, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  viewed: 'Viewed',
  logged_in: 'Logged in',
  logged_out: 'Logged out',
};
const ACTION_ICON: Record<LogAction, React.ElementType> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  viewed: Eye,
  logged_in: LogIn,
  logged_out: LogOut,
};
const ACTION_COLOR: Record<LogAction, string> = {
  created: '#4ade80',
  updated: '#60a5fa',
  deleted: '#f87171',
  viewed: '#9ca3af',
  logged_in: '#a5b4fc',
  logged_out: '#6b7280',
};
const ENTITY_LABELS: Record<LogEntity, string> = {
  ticket: 'Ticket',
  article: 'Article',
  user: 'User',
  profile: 'Profile',
  system: 'System',
};
const ALL_ACTIONS: Array<LogAction | 'all'> = [
  'all',
  'created',
  'updated',
  'deleted',
  'viewed',
  'logged_in',
  'logged_out',
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function Panel({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      <div
        className='h-px'
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
        }}
      />
      {children}
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200'
      style={
        active
          ? {
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#a5b4fc',
            }
          : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
            }
      }
    >
      {label}
    </button>
  );
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<LogAction | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);
    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setLogs(data ?? []);
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter(
    (l) =>
      (l.description.toLowerCase().includes(search.toLowerCase()) ||
        (l.user_email ?? '').toLowerCase().includes(search.toLowerCase())) &&
      (actionFilter === 'all' || l.action === actionFilter),
  );

  return (
    <div
      className='relative min-h-screen space-y-6 p-8'
      style={{ background: '#06060f' }}
    >
      <div className='pointer-events-none fixed inset-0' style={{ zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className='relative' style={{ zIndex: 1 }}>
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 mb-6'
          style={{ animationFillMode: 'forwards' }}
        >
          <p
            className='mb-1 text-xs font-bold uppercase tracking-widest'
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Audit
          </p>
          <h1
            className='text-4xl font-black tracking-tight'
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Activity Logs
          </h1>
          <p
            className='mt-1 text-sm'
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {loading
              ? 'Loading…'
              : `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Filters */}
        <Panel
          className='animate-fade-in-up opacity-0 mb-4'
          style={{
            animationDelay: '80ms',
            animationFillMode: 'forwards',
          }}
        >
          <div className='space-y-3 p-4'>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='relative min-w-[200px] flex-1'>
                <Search
                  size={13}
                  className='absolute left-3 top-1/2 -translate-y-1/2'
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                />
                <input
                  placeholder='Search description or user…'
                  className='h-9 w-full rounded-xl pl-9 pr-4 text-sm outline-none'
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* Date range */}
              <div className='flex items-center gap-2'>
                <input
                  type='date'
                  className='h-9 rounded-xl px-3 text-xs outline-none'
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)',
                    colorScheme: 'dark',
                  }}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
                <input
                  type='date'
                  className='h-9 rounded-xl px-3 text-xs outline-none'
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)',
                    colorScheme: 'dark',
                  }}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
                {(dateFrom || dateTo) && (
                  <button
                    type='button'
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className='rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-white/10'
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type='button'
                onClick={fetchLogs}
                disabled={loading}
                className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10'
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                <RefreshCw
                  size={13}
                  className={cn(loading && 'animate-spin')}
                />
              </button>
            </div>
            {/* Action pills */}
            <div className='flex flex-wrap gap-1.5'>
              {ALL_ACTIONS.map((a) => (
                <Pill
                  key={a}
                  label={a === 'all' ? 'All' : ACTION_LABELS[a as LogAction]}
                  active={actionFilter === a}
                  onClick={() => setActionFilter(a as LogAction | 'all')}
                />
              ))}
            </div>
          </div>
        </Panel>

        {/* Log list */}
        <Panel
          className='animate-fade-in-up opacity-0'
          style={{
            animationDelay: '160ms',
            animationFillMode: 'forwards',
          }}
        >
          <div
            className='px-5 py-4'
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className='text-sm font-bold text-white'>Events</p>
            <p className='text-xs' style={{ color: 'rgba(255,255,255,0.3)' }}>
              Showing last 200 events
            </p>
          </div>

          {error && (
            <div
              className='mx-5 my-3 rounded-xl px-4 py-3 text-sm'
              style={{
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.2)',
                color: '#fca5a5',
              }}
            >
              Failed to load: {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div
              className='flex flex-col items-center gap-3 py-16'
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <Activity size={36} />
              <p className='text-sm font-medium'>No events found</p>
            </div>
          )}

          {!error &&
            filtered.map((log, i) => {
              const Icon = ACTION_ICON[log.action];
              const color = ACTION_COLOR[log.action];
              return (
                <div
                  key={log.id}
                  className='flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/2'
                  style={{
                    borderBottom:
                      i < filtered.length - 1
                        ? '1px solid rgba(255,255,255,0.04)'
                        : 'none',
                  }}
                >
                  {/* Icon */}
                  <div
                    className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl'
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <Icon size={13} style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className='min-w-0 flex-1'>
                    <p
                      className='truncate text-sm font-medium'
                      style={{ color: 'rgba(255,255,255,0.8)' }}
                    >
                      {log.description}
                    </p>
                    <div className='mt-1.5 flex flex-wrap items-center gap-2'>
                      <span
                        className='rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize'
                        style={{ background: `${color}18`, color }}
                      >
                        {ACTION_LABELS[log.action]}
                      </span>
                      <span
                        className='rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize'
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {ENTITY_LABELS[log.entity]}
                      </span>
                      {log.user_email && (
                        <span
                          className='truncate text-[11px]'
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          {log.user_email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className='shrink-0 text-right'>
                    <p
                      className='text-xs font-semibold'
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      {timeAgo(log.created_at)}
                    </p>
                    <p
                      className='text-[10px]'
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
        </Panel>
      </div>
    </div>
  );
}

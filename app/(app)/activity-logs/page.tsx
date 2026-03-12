'use client';

import {
  Activity,
  ArrowUpRight,
  Eye,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Panel } from '@/components/ui/panel';
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
              background: 'var(--app-nav-active-bg)',
              border: '1px solid var(--app-nav-active-border)',
              color: 'var(--app-nav-active-text)',
            }
          : {
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-nav-idle-text)',
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
      className='min-h-screen space-y-6 p-8'
      style={{ background: 'var(--app-bg)' }}
    >
      <div className='relative' >
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 mb-6'
          style={{ animationFillMode: 'forwards' }}
        >
          <p
            className='mb-1 text-xs font-bold uppercase tracking-widest'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Audit
          </p>
          <h1 className='text-xl font-bold tracking-tight' style={{ color: 'var(--app-text-primary)' }}>
            Activity Logs
          </h1>
          <p
            className='mt-1 text-sm'
            style={{ color: 'var(--app-text-muted)' }}
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
              <div className='min-w-[200px] flex-1'>
                <Search
                  size={13}
                  className='absolute left-3 top-1/2 -translate-y-1/2'
                  style={{ color: 'var(--app-text-muted)' }}
                />
                <input
                  placeholder='Search description or user…'
                  className='h-9 w-full rounded-md pl-9 pr-4 text-sm outline-none'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-primary)',
                  }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* Date range */}
              <div className='flex items-center gap-2'>
                <input
                  type='date'
                  className='h-9 rounded-md px-3 text-xs outline-none'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-secondary)',
                    colorScheme: 'dark',
                  }}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span style={{ color: 'var(--app-text-faint)' }}>→</span>
                <input
                  type='date'
                  className='h-9 rounded-md px-3 text-xs outline-none'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-secondary)',
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
                    className='rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-(--app-surface-raised)'
                    style={{ color: 'var(--app-nav-idle-text)' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type='button'
                onClick={fetchLogs}
                disabled={loading}
                className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-(--app-surface-raised)'
                style={{ color: 'var(--app-text-muted)' }}
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
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Events
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Showing last 200 events
            </p>
          </div>

          {error && (
            <div
              className='mx-5 my-3 rounded-md px-4 py-3 text-sm'
              style={{
                background:
                  'color-mix(in srgb, var(--destructive) 12%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
                color: 'var(--destructive)',
              }}
            >
              Failed to load: {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div
              className='flex flex-col items-center gap-3 py-16'
              style={{ color: 'var(--app-text-faint)' }}
            >
              <Activity size={36} />
              <p className='text-sm font-medium'>No events found</p>
            </div>
          )}

          {!error &&
            filtered.map((log, i) => {
              const Icon = ACTION_ICON[log.action];
              const color = ACTION_COLOR[log.action];
              const entityHref =
                log.entity_id && log.entity === 'ticket'
                  ? `/tickets/${log.entity_id}`
                  : log.entity_id && log.entity === 'article'
                    ? `/knowledge-base/${log.entity_id}`
                    : log.entity_id && (log.entity === 'user' || log.entity === 'profile')
                      ? `/users/${log.entity_id}`
                      : null;

              const rowContent = (
                <>
                  {/* Icon */}
                  <div
                    className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md'
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
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {log.description}
                    </p>
                    <div className='mt-1.5 flex flex-wrap items-center gap-2'>
                      <span
                        className='rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize'
                        style={{
                          background: `color-mix(in srgb, ${color} 18%, transparent)`,
                          color,
                        }}
                      >
                        {ACTION_LABELS[log.action]}
                      </span>
                      <span
                        className='rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize'
                        style={{
                          background: 'var(--app-surface)',
                          color: 'var(--app-nav-idle-text)',
                        }}
                      >
                        {ENTITY_LABELS[log.entity]}
                      </span>
                      {log.user_email && (
                        <span
                          className='truncate text-[11px]'
                          style={{ color: 'var(--app-text-muted)' }}
                        >
                          {log.user_email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time + link hint */}
                  <div className='shrink-0 text-right flex items-center gap-2'>
                    <div>
                      <p
                        className='text-xs font-semibold'
                        style={{ color: 'var(--app-text-muted)' }}
                      >
                        {timeAgo(log.created_at)}
                      </p>
                      <p
                        className='text-[10px]'
                        style={{ color: 'var(--app-text-faint)' }}
                      >
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                    {entityHref && (
                      <ArrowUpRight
                        size={13}
                        className='opacity-0 group-hover:opacity-100 transition-opacity'
                        style={{ color: 'var(--app-text-muted)' }}
                      />
                    )}
                  </div>
                </>
              );

              const sharedClassName = 'group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-(--app-surface-raised)';
              const sharedStyle = {
                borderBottom:
                  i < filtered.length - 1
                    ? '1px solid var(--app-border)'
                    : 'none',
              };

              return entityHref ? (
                <Link
                  key={log.id}
                  href={entityHref}
                  className={sharedClassName}
                  style={sharedStyle}
                >
                  {rowContent}
                </Link>
              ) : (
                <div
                  key={log.id}
                  className={sharedClassName}
                  style={sharedStyle}
                >
                  {rowContent}
                </div>
              );
            })}
        </Panel>
      </div>
    </div>
  );
}

'use client';

import {
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  type DbNotification,
  useDbNotifications,
} from '@/hooks/useDbNotifications';

type FilterType =
  | 'all'
  | 'unread'
  | 'created'
  | 'updated'
  | 'closed'
  | 'assigned'
  | 'comment';

const TYPE_ICON: Record<string, React.ElementType> = {
  created: Plus,
  updated: RefreshCw,
  closed: CheckCircle2,
  assigned: User,
  comment: Bell,
  sla_breach: BellOff,
  mention: Bell,
};

const TYPE_COLOR: Record<string, string> = {
  created: 'var(--app-stat-open)',
  updated: 'var(--app-accent)',
  closed: 'var(--app-stat-closed)',
  assigned: 'var(--app-stat-users)',
  comment: 'var(--app-stat-resolution)',
  sla_breach: 'var(--app-priority-critical)',
  mention: 'var(--app-accent)',
};

function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function Pill({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 hover:-translate-y-0.5'
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
      {count !== undefined && count > 0 && (
        <span
          className='rounded-full px-1.5 py-0.5 text-[10px] font-bold'
          style={{
            background: active
              ? 'var(--app-accent)'
              : 'var(--app-surface-raised)',
            color: active ? '#fff' : 'var(--app-text-muted)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: DbNotification;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICON[notification.type] ?? Bell;
  const color = TYPE_COLOR[notification.type] ?? 'var(--app-accent)';
  const isRead = Boolean(notification.read_at);

  return (
    <div
      className='flex items-start gap-4 px-6 py-4 transition-all duration-150'
      style={{
        background: isRead ? 'transparent' : 'var(--app-surface-raised)',
        borderBottom: '1px solid var(--app-border)',
      }}
    >
      {/* Unread dot */}
      <div className='mt-2 h-2.5 w-2.5 shrink-0'>
        {!isRead && (
          <span
            className='block h-2.5 w-2.5 rounded-full animate-pulse-glow'
            style={{ background: 'var(--app-accent)' }}
          />
        )}
      </div>

      {/* Icon */}
      <div
        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md'
        style={{
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        }}
      >
        <Icon size={15} style={{ color }} />
      </div>

      {/* Content */}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <p
            className='text-sm font-bold'
            style={{ color: 'var(--app-text-primary)' }}
          >
            {notification.title}
          </p>
          <span
            className='rounded-md px-2 py-0.5 text-[10px] font-bold uppercase'
            style={{
              background: `color-mix(in srgb, ${color} 15%, transparent)`,
              color,
            }}
          >
            {notification.type.replace(/_/g, ' ')}
          </span>
        </div>
        <p
          className='mt-0.5 text-xs'
          style={{ color: 'var(--app-text-muted)' }}
        >
          {notification.message}
        </p>
        {(notification.ticket_id || notification.link) && (
          <Link
            href={notification.link ?? `/tickets/${notification.ticket_id}`}
            className='mt-1 inline-block text-xs font-semibold hover:underline'
            style={{ color: 'var(--app-accent-text)' }}
          >
            {notification.ticket_id ? 'View ticket →' : 'Open notification →'}
          </Link>
        )}
      </div>

      {/* Time + actions */}
      <div className='flex shrink-0 items-center gap-2'>
        <span
          className='text-[11px]'
          style={{ color: 'var(--app-text-faint)' }}
        >
          {timeAgo(notification.created_at)}
        </span>
        {!isRead && (
          <button
            type='button'
            onClick={onMarkRead}
            aria-label='Mark notification as read'
            className='flex h-7 w-7 items-center justify-center rounded-lg transition-colors'
            style={{ color: 'var(--app-text-muted)' }}
            title='Mark as read'
          >
            <Check size={13} />
          </button>
        )}
        <button
          type='button'
          onClick={onDelete}
          aria-label='Delete notification'
          className='flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:text-red-400'
          style={{ color: 'var(--app-text-muted)' }}
          title='Delete'
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const {
    notifications,
    loading,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
    refresh,
  } = useDbNotifications(user?.id);

  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read_at;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className='min-h-screen' style={{ background: 'var(--app-bg)' }}>
      <div className='space-y-6 p-8'>
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 flex items-center justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div className='flex items-center gap-3'>
            <div
              className='flex h-10 w-10 items-center justify-center rounded-md'
              style={{
                background: 'var(--app-accent-dim)',
                border: '1px solid var(--app-accent-border)',
              }}
            >
              <Bell size={18} style={{ color: 'var(--app-accent-text)' }} />
            </div>
            <div>
              <h1
                className='text-2xl font-bold tracking-tight'
                style={{ color: 'var(--app-text-primary)' }}
              >
                Notifications
              </h1>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up'}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {unreadCount > 0 && (
              <button
                type='button'
                onClick={markAllRead}
                className='flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5'
                style={{
                  background: 'var(--app-accent-dim)',
                  border: '1px solid var(--app-accent-border)',
                  color: 'var(--app-accent-text)',
                }}
              >
                <Check size={13} /> Mark all read
              </button>
            )}
            <button
              type='button'
              onClick={refresh}
              className='flex h-9 w-9 items-center justify-center rounded-md transition-all hover:-translate-y-0.5'
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-secondary)',
              }}
              title='Refresh'
            >
              <RefreshCw size={14} />
            </button>
            {notifications.length > 0 && (
              <button
                type='button'
                onClick={() => {
                  if (
                    window.confirm(
                      'Clear all notifications? This cannot be undone.',
                    )
                  )
                    clearAll();
                }}
                className='flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5'
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text-muted)',
                }}
              >
                <Trash2 size={13} /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div
          className='animate-fade-in-up opacity-0 flex flex-wrap items-center gap-2'
          style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}
        >
          <Filter size={13} style={{ color: 'var(--app-text-muted)' }} />
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'created', label: 'Created' },
              { key: 'assigned', label: 'Assigned' },
              { key: 'updated', label: 'Updated' },
              { key: 'closed', label: 'Closed' },
            ] as Array<{ key: FilterType; label: string; count?: number }>
          ).map((f) => (
            <Pill
              key={f.key}
              label={f.label}
              active={filter === f.key}
              onClick={() => {
                setFilter(f.key);
                setPage(0);
              }}
              count={f.count}
            />
          ))}
        </div>

        {/* Notification list */}
        <div
          className='glass-card animate-fade-in-up opacity-0 overflow-hidden'
          style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}
        >
          <div className='card-accent-line' />
          {loading ? (
            <div className='flex justify-center py-16'>
              <Loader2
                size={20}
                className='animate-spin'
                style={{ color: 'var(--app-text-faint)' }}
              />
            </div>
          ) : paginated.length === 0 ? (
            <div
              className='flex flex-col items-center gap-3 py-16'
              style={{ color: 'var(--app-text-faint)' }}
            >
              <Bell size={32} />
              <p className='text-sm'>
                {filter === 'all'
                  ? 'No notifications yet'
                  : `No ${filter} notifications`}
              </p>
            </div>
          ) : (
            paginated.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onMarkRead={() => markRead(n.id)}
                onDelete={() => deleteNotification(n.id)}
              />
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className='flex items-center justify-between px-6 py-3'
              style={{ borderTop: '1px solid var(--app-border)' }}
            >
              <span
                className='text-xs'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Page {page + 1} of {totalPages} · {filtered.length}{' '}
                notifications
              </span>
              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className='flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-30'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-secondary)',
                  }}
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type='button'
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className='flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-30'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-secondary)',
                  }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

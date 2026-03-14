'use client';

import {
  AlertTriangle,
  AtSign,
  Bell,
  CheckCircle2,
  MessageSquare,
  Plus,
  RefreshCw,
  User,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  type DbNotification,
  useDbNotifications,
} from '@/hooks/useDbNotifications';

function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 0) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days > 365) return date.toLocaleDateString();
  return `${days}d ago`;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  created: Plus,
  updated: RefreshCw,
  closed: CheckCircle2,
  assigned: User,
  comment: MessageSquare,
  sla_breach: AlertTriangle,
  mention: AtSign,
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: DbNotification;
  onRead: () => void;
}) {
  const router = useRouter();
  const Icon = TYPE_ICON[notification.type] ?? RefreshCw;
  const isRead = Boolean(notification.read_at);

  return (
    <button
      type='button'
      onClick={() => {
        onRead();
        if (notification.ticket_id) {
          router.push(`/tickets/${notification.ticket_id}`);
        } else if (notification.link) {
          router.push(notification.link);
        }
      }}
      className='w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150'
      style={{
        background: isRead ? 'var(--app-surface)' : 'var(--app-surface-raised)',
        borderBottom: '1px solid var(--app-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--app-surface-raised)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isRead
          ? 'var(--app-surface)'
          : 'var(--app-surface-raised)';
      }}
    >
      <div className='mt-1 h-2 w-2 shrink-0'>
        {!isRead && (
          <span
            className='block h-2 w-2 rounded-full'
            style={{ background: 'var(--app-accent)' }}
          />
        )}
      </div>

      <div
        className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg'
        style={{
          background: 'var(--app-accent-dim)',
          border: '1px solid var(--app-accent-border)',
        }}
      >
        <Icon size={13} style={{ color: 'var(--app-accent-text)' }} />
      </div>

      <div className='min-w-0 flex-1'>
        <p
          className='truncate text-xs font-bold'
          style={{ color: 'var(--app-text-primary)' }}
        >
          {notification.ticket_title ?? notification.title}
        </p>
        <p
          className='mt-0.5 text-[11px]'
          style={{ color: 'var(--app-text-muted)' }}
        >
          {notification.message}
        </p>
      </div>

      <span
        className='mt-0.5 shrink-0 text-[10px]'
        style={{ color: 'var(--app-text-faint)' }}
      >
        {timeAgo(notification.created_at)}
      </span>
    </button>
  );
}

export function NotificationBell({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const { user } = useCurrentUser();
  const { notifications, unreadCount, markRead, markAllRead } =
    useDbNotifications(user?.id);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  return (
    <div ref={panelRef} className='relative' style={{ zIndex: 50 }}>
      <button
        type='button'
        onClick={onToggle}
        aria-label={open ? 'Close notifications' : 'Open notifications'}
        aria-haspopup='dialog'
        aria-expanded={open}
        className='relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5'
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <Bell size={18} style={{ color: 'var(--app-text-secondary)' }} />
        {unreadCount > 0 && (
          <span
            className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold'
            style={{
              background: 'var(--app-priority-critical)',
              color: '#fff',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role='dialog'
          aria-label='Notifications'
          className='glass-card absolute bottom-14 right-0 w-[360px] overflow-hidden'
          style={{
            maxHeight: '480px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div className='card-accent-line' />

          <div
            className='flex items-center justify-between px-4 py-3'
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <div className='flex items-center gap-2'>
              <Bell size={14} style={{ color: 'var(--app-accent-text)' }} />
              <span
                className='text-sm font-bold'
                style={{ color: 'var(--app-text-primary)' }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className='rounded-full px-2 py-0.5 text-[10px] font-bold'
                  style={{
                    background: 'var(--app-accent-dim)',
                    color: 'var(--app-accent-text)',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div className='flex items-center gap-2'>
              {unreadCount > 0 && (
                <button
                  type='button'
                  onClick={markAllRead}
                  className='text-[11px] font-semibold transition-opacity hover:opacity-70'
                  style={{ color: 'var(--app-accent-text)' }}
                >
                  Mark all read
                </button>
              )}
              <button
                type='button'
                onClick={onClose}
                aria-label='Close notifications'
                className='flex h-6 w-6 items-center justify-center rounded-lg transition-colors'
                style={{ color: 'var(--app-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'var(--app-surface-raised)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                className='flex flex-col items-center gap-2 py-12'
                style={{ color: 'var(--app-text-faint)' }}
              >
                <Bell size={28} />
                <p className='text-sm'>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markRead(notification.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

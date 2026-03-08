'use client';

import { NotificationType } from '@/hooks/useNotifications';
import { CheckCircle2, Plus, RefreshCw, Router, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  created: Plus,
  updated: RefreshCw,
  closed: CheckCircle2,
  assigned: User,
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const router = useRouter();
  const Icon = TYPE_ICON[notification.type as NotificationType];

  return (
    <button
      type='button'
      onClick={() => {
        onRead();
        router.push(`/tickets/${notification.ticketId}`);
      }}
      className={
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150'
      }
      style={{
        background: notification.read
          ? 'var(--app-surface)'
          : 'var(--app-surface-raised)',
        borderBottom: '1px solid var(--app-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--app-surface-raised)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = notification.read
          ? 'var(--app-surface)'
          : 'var(--app-surface-raised)';
      }}
    >
      <div className={'mt-2 shrink-0 w-2 h-2'}>
        {!notification.read && (
          <span
            className='block w-2 h-2 rounded-full'
            style={{ background: 'var(--app-accent)' }}
          />
        )}
      </div>


      <div className={'shrink-0 flex h-7 w-7 items-center justify-between rounded-lg'}
      style={{
        background:'var(--app-accent-dim)',
      }}
    </button>
  );
}

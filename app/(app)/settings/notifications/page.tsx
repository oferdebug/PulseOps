'use client';

import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  type NotificationPreferences,
  useDbNotifications,
} from '@/hooks/useDbNotifications';

const PREF_ITEMS: Array<{
  key: keyof NotificationPreferences;
  icon: React.ElementType;
  title: string;
  description: string;
}> = [
  {
    key: 'ticket_created',
    icon: Plus,
    title: 'New Tickets',
    description: 'When a new ticket is created in your organization',
  },
  {
    key: 'ticket_updated',
    icon: RefreshCw,
    title: 'Ticket Updates',
    description: 'When a ticket you created or are assigned to is updated',
  },
  {
    key: 'ticket_closed',
    icon: CheckCircle2,
    title: 'Ticket Closed',
    description: 'When a ticket is resolved and closed',
  },
  {
    key: 'ticket_assigned',
    icon: User,
    title: 'Ticket Assigned',
    description: 'When a ticket is assigned to you',
  },
  {
    key: 'ticket_commented',
    icon: MessageSquare,
    title: 'New Comments',
    description: 'When someone comments on your ticket',
  },
  {
    key: 'sla_breach',
    icon: Shield,
    title: 'SLA Breach',
    description: 'When a ticket is approaching or has breached its SLA',
  },
  {
    key: 'mention',
    icon: Bell,
    title: 'Mentions',
    description: 'When someone mentions you in a comment',
  },
];

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label={checked ? 'Disable notification' : 'Enable notification'}
      onClick={() => onChange(!checked)}
      className='h-6 w-11 shrink-0 rounded-full transition-colors duration-200'
      style={{
        background: checked ? 'var(--app-accent)' : 'var(--app-surface-raised)',
        border: `1px solid ${checked ? 'var(--app-accent)' : 'var(--app-border)'}`,
      }}
    >
      <span
        className='block h-4 w-4 rounded-full transition-transform duration-200'
        style={{
          background: checked ? '#fff' : 'var(--app-text-muted)',
          transform: checked ? 'translateX(22px)' : 'translateX(3px)',
          marginTop: '2px',
        }}
      />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const { user } = useCurrentUser();
  const { preferences, updatePreferences, loading } = useDbNotifications(
    user?.id,
  );

  return (
    <div
      className='min-h-screen'
      style={{ background: 'var(--app-bg)' }}
    >
      <div className='space-y-6 p-8' >
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 flex items-center gap-4'
          style={{ animationFillMode: 'forwards' }}
        >
          <Link
            href='/settings'
            className='flex h-9 w-9 items-center justify-center rounded-md transition-all hover:-translate-y-0.5'
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text-secondary)',
            }}
          >
            <ArrowLeft size={15} />
          </Link>
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
                Notification Preferences
              </h1>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                Choose which notifications you want to receive
              </p>
            </div>
          </div>
        </div>

        {/* Preferences list */}
        <div
          className='glass-card animate-fade-in-up opacity-0 max-w-2xl overflow-hidden'
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
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
          ) : (
            PREF_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className='flex items-center gap-4 px-6 py-5'
                  style={{
                    borderBottom:
                      i < PREF_ITEMS.length - 1
                        ? '1px solid var(--app-border)'
                        : 'none',
                  }}
                >
                  <div
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md'
                    style={{
                      background: 'var(--app-surface-raised)',
                      border: '1px solid var(--app-border)',
                    }}
                  >
                    <Icon
                      size={15}
                      style={{ color: 'var(--app-text-secondary)' }}
                    />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p
                      className='text-sm font-bold'
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {item.title}
                    </p>
                    <p
                      className='text-xs'
                      style={{ color: 'var(--app-text-muted)' }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={preferences[item.key]}
                    onChange={(checked) =>
                      updatePreferences({ [item.key]: checked })
                    }
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Info */}
        <div
          className='animate-fade-in-up opacity-0 max-w-2xl'
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div
            className='flex items-start gap-3 rounded-md p-4'
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
            }}
          >
            <BellOff
              size={14}
              className='mt-0.5 shrink-0'
              style={{ color: 'var(--app-text-muted)' }}
            />
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Disabled notifications will not appear in your notification center
              or trigger real-time alerts. You can always re-enable them later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

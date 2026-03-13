'use client';

import {
  ArrowRight,
  Circle,
  Clock,
  GitCommitHorizontal,
  Loader2,
  UserCircle,
} from 'lucide-react';
import type { TicketHistoryEntry } from '@/hooks/useTicketHistory';
import { useTicketHistory } from '@/hooks/useTicketHistory';

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  priority: 'Priority',
  assigned_to: 'Assignment',
  title: 'Title',
  description: 'Description',
  created: 'Created',
};

const FIELD_COLORS: Record<string, string> = {
  status: 'var(--app-accent)',
  priority: 'var(--app-priority-high)',
  assigned_to: 'var(--app-nav-active-text)',
  title: 'var(--app-text-muted)',
  created: 'var(--app-health-healthy)',
};

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatValue(field: string, value: string | null): string {
  if (!value) return '—';
  if (field === 'status')
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  if (field === 'priority')
    return value.charAt(0).toUpperCase() + value.slice(1);
  if (field === 'assigned_to') return value.slice(0, 8);
  return value;
}

function EntryIcon({ field }: { field: string }) {
  const color = FIELD_COLORS[field] ?? 'var(--app-text-faint)';
  if (field === 'created') return <Circle size={12} style={{ color }} />;
  if (field === 'assigned_to')
    return <UserCircle size={14} style={{ color }} />;
  return <GitCommitHorizontal size={14} style={{ color }} />;
}

function HistoryEntry({ entry }: { entry: TicketHistoryEntry }) {
  const authorName =
    entry.profile?.full_name?.trim() ||
    entry.profile?.email ||
    (entry.changed_by ? entry.changed_by.slice(0, 8) : 'System');

  return (
    <div className='flex gap-3 py-2.5'>
      {/* Dot / icon */}
      <div className='flex flex-col items-center pt-0.5'>
        <div
          className='flex h-6 w-6 items-center justify-center rounded-full'
          style={{ background: 'var(--app-surface-raised)' }}
        >
          <EntryIcon field={entry.field_name} />
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 space-y-0.5'>
        <div className='flex flex-wrap items-center gap-2'>
          <span
            className='text-xs font-bold'
            style={{
              color: FIELD_COLORS[entry.field_name] ?? 'var(--app-accent)',
            }}
          >
            {FIELD_LABELS[entry.field_name] ?? entry.field_name}
          </span>

          {entry.field_name !== 'created' && entry.old_value !== null && (
            <span
              className='flex items-center gap-1 text-xs'
              style={{ color: 'var(--app-text-muted)' }}
            >
              <span
                className='rounded px-1.5 py-0.5'
                style={{ background: 'var(--app-surface-raised)' }}
              >
                {formatValue(entry.field_name, entry.old_value)}
              </span>
              <ArrowRight size={10} />
              <span
                className='rounded px-1.5 py-0.5 font-semibold'
                style={{ background: 'var(--app-surface-raised)' }}
              >
                {formatValue(entry.field_name, entry.new_value)}
              </span>
            </span>
          )}
        </div>

        <div
          className='flex items-center gap-2 text-[11px]'
          style={{ color: 'var(--app-text-faint)' }}
        >
          <span>{authorName}</span>
          <span>·</span>
          <Clock size={10} />
          <span>{formatTimestamp(entry.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export function TicketTimeline({ ticketId }: { ticketId: string }) {
  const { history, loading, error } = useTicketHistory(ticketId);

  if (loading) {
    return (
      <div
        className='flex items-center gap-2 py-4'
        style={{ color: 'var(--app-text-faint)' }}
      >
        <Loader2 size={14} className='animate-spin' />
        <span className='text-xs'>Loading history…</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className='py-2 text-xs' style={{ color: 'var(--destructive)' }}>
        {error}
      </p>
    );
  }

  if (history.length === 0) {
    return (
      <p className='py-2 text-xs' style={{ color: 'var(--app-text-faint)' }}>
        No history yet.
      </p>
    );
  }

  return (
    <div className='relative space-y-0'>
      {/* Vertical line */}
      <div
        className='absolute left-3 top-4 bottom-4 w-px'
        style={{ background: 'var(--app-border)' }}
      />
      {history.map((entry) => (
        <HistoryEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

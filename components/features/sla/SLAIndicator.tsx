'use client';

import { AlertTriangle, CheckCircle2, Clock, Shield } from 'lucide-react';
import type { SLAStatus, TicketSLA } from '@/hooks/useSLA';
import { getSLAStatus, getTimeRemaining } from '@/hooks/useSLA';

const STATUS_CONFIG: Record<
  SLAStatus,
  { color: string; bg: string; icon: React.ElementType; label: string }
> = {
  ok: {
    color: 'var(--app-health-healthy)',
    bg: 'color-mix(in srgb, var(--app-health-healthy) 12%, transparent)',
    icon: Clock,
    label: 'On Track',
  },
  warning: {
    color: 'var(--app-priority-high)',
    bg: 'color-mix(in srgb, var(--app-priority-high) 12%, transparent)',
    icon: AlertTriangle,
    label: 'At Risk',
  },
  breached: {
    color: 'var(--destructive)',
    bg: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
    icon: AlertTriangle,
    label: 'Breached',
  },
  met: {
    color: 'var(--app-health-healthy)',
    bg: 'color-mix(in srgb, var(--app-health-healthy) 12%, transparent)',
    icon: CheckCircle2,
    label: 'Met',
  },
};

function SLABadge({
  label,
  due,
  completedAt,
  breached,
}: {
  label: string;
  due: string | null;
  completedAt: string | null;
  breached: boolean;
}) {
  const status = getSLAStatus(due, completedAt, breached);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className='flex items-center gap-2 rounded-md px-3 py-2'
      style={{
        background: config.bg,
        border: `1px solid color-mix(in srgb, ${config.color} 25%, transparent)`,
      }}
    >
      <Icon size={13} style={{ color: config.color }} />
      <div className='flex flex-col'>
        <span
          className='text-[10px] font-bold uppercase tracking-wider'
          style={{ color: 'var(--app-text-muted)' }}
        >
          {label}
        </span>
        <span className='text-xs font-bold' style={{ color: config.color }}>
          {completedAt
            ? breached
              ? 'Breached'
              : 'Met'
            : getTimeRemaining(due)}
        </span>
      </div>
    </div>
  );
}

export function SLAIndicator({ sla }: { sla: TicketSLA | null }) {
  if (!sla) return null;

  return (
    <div className='flex flex-wrap gap-2'>
      <div className='mr-2 flex items-center gap-1.5'>
        <Shield size={12} style={{ color: 'var(--app-text-muted)' }} />
        <span
          className='text-[10px] font-bold uppercase tracking-wider'
          style={{ color: 'var(--app-text-muted)' }}
        >
          SLA
        </span>
      </div>
      <SLABadge
        label='First Response'
        due={sla.first_response_due}
        completedAt={sla.first_response_at}
        breached={sla.first_response_breached}
      />
      <SLABadge
        label='Resolution'
        due={sla.resolution_due}
        completedAt={sla.resolved_at}
        breached={sla.resolution_breached}
      />
    </div>
  );
}

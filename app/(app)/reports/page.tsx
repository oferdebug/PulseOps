'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Loader2,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  AgentWorkloadChart,
  PriorityBarChart,
  StatusPieChart,
  TicketTrendChart,
} from '@/components/features/charts/DashboardCharts';
import { useReports } from '@/hooks/useReports';

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
    <div className={`glass-card ${className}`} style={style}>
      <div className='card-accent-line' />
      {children}
    </div>
  );
}

const PERIOD_OPTIONS = [
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' },
];

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error, refresh } = useReports(days);

  return (
    <div
      className='min-h-screen space-y-6 p-8'
      style={{ background: 'var(--app-bg)' }}
    >
      <div className='relative' >
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 mb-6 flex items-end justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <p
              className='mb-1 text-xs font-bold uppercase tracking-widest'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Analytics
            </p>
            <h1 className='text-xl font-bold tracking-tight' style={{ color: 'var(--app-text-primary)' }}>
              Reports
            </h1>
            <p
              className='mt-1 text-sm'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Ticket performance metrics and trends
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className='rounded-md px-3 py-2 text-sm font-semibold outline-none'
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-primary)',
              }}
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type='button'
              onClick={refresh}
              disabled={loading}
              className='flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-[var(--app-surface-raised)]'
              style={{
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-muted)',
              }}
              aria-label='Refresh reports'
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading && !data && (
          <div
            className='flex items-center gap-3 py-20'
            style={{ color: 'var(--app-text-faint)' }}
          >
            <Loader2 size={20} className='animate-spin' />
            <span className='text-sm'>Loading reports…</span>
          </div>
        )}

        {error && (
          <Panel>
            <div
              className='px-5 py-4 text-sm'
              style={{ color: 'var(--destructive)' }}
            >
              {error}
            </div>
          </Panel>
        )}

        {data && (
          <>
            {/* KPI Cards */}
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6'>
              {[
                {
                  label: 'Total Tickets',
                  value: data.totalTickets,
                  icon: Ticket,
                  color: 'var(--app-accent)',
                },
                {
                  label: 'Open',
                  value: data.openTickets,
                  icon: ArrowUpRight,
                  color: 'var(--app-stat-open)',
                },
                {
                  label: 'Closed',
                  value: data.closedTickets,
                  icon: ArrowDownRight,
                  color: 'var(--app-health-healthy)',
                },
                {
                  label: 'Avg Resolution',
                  value: data.avgResolutionHours,
                  suffix: 'h',
                  icon: Clock,
                  color: 'var(--app-priority-medium)',
                },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={kpi.label}
                    className='animate-fade-in-up opacity-0'
                    style={{
                      animationDelay: `${i * 60}ms`,
                      animationFillMode: 'forwards',
                    }}
                  >
                    <Panel>
                      <div className='flex items-center gap-3 p-5'>
                        <div
                          className='flex h-10 w-10 items-center justify-center rounded-md'
                          style={{
                            background: `color-mix(in srgb, ${kpi.color} 15%, transparent)`,
                          }}
                        >
                          <Icon size={18} style={{ color: kpi.color }} />
                        </div>
                        <div>
                          <p
                            className='text-[10px] font-bold uppercase tracking-wider'
                            style={{ color: 'var(--app-text-muted)' }}
                          >
                            {kpi.label}
                          </p>
                          <p
                            className='text-2xl font-bold'
                            style={{ color: 'var(--app-text-primary)' }}
                          >
                            {kpi.value}
                            {'suffix' in kpi ? kpi.suffix : ''}
                          </p>
                        </div>
                      </div>
                    </Panel>
                  </div>
                );
              })}
            </div>

            {/* Charts row */}
            <div className='grid gap-4 lg:grid-cols-2 mb-6'>
              {/* Ticket Trend */}
              <Panel
                className='animate-fade-in-up opacity-0'
                style={{
                  animationDelay: '240ms',
                  animationFillMode: 'forwards',
                }}
              >
                <div className='p-5'>
                  <div className='mb-4 flex items-center gap-2'>
                    <TrendingUp
                      size={14}
                      style={{ color: 'var(--app-accent)' }}
                    />
                    <p
                      className='text-sm font-bold'
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      Ticket Volume
                    </p>
                  </div>
                  <TicketTrendChart data={data.dailyCounts} />
                </div>
              </Panel>

              {/* Agent Workload */}
              <Panel
                className='animate-fade-in-up opacity-0'
                style={{
                  animationDelay: '320ms',
                  animationFillMode: 'forwards',
                }}
              >
                <div className='p-5'>
                  <div className='mb-4 flex items-center gap-2'>
                    <Users size={14} style={{ color: 'var(--app-accent)' }} />
                    <p
                      className='text-sm font-bold'
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      Agent Workload
                    </p>
                  </div>
                  {data.agentWorkload.length > 0 ? (
                    <AgentWorkloadChart data={data.agentWorkload} />
                  ) : (
                    <p
                      className='text-xs'
                      style={{ color: 'var(--app-text-faint)' }}
                    >
                      No assigned tickets in this period.
                    </p>
                  )}
                </div>
              </Panel>
            </div>

            {/* Status + Priority */}
            <div className='grid gap-4 lg:grid-cols-2'>
              <Panel
                className='animate-fade-in-up opacity-0'
                style={{
                  animationDelay: '400ms',
                  animationFillMode: 'forwards',
                }}
              >
                <div className='p-5'>
                  <div className='mb-4 flex items-center gap-2'>
                    <BarChart3
                      size={14}
                      style={{ color: 'var(--app-accent)' }}
                    />
                    <p
                      className='text-sm font-bold'
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      By Status
                    </p>
                  </div>
                  <StatusPieChart data={data.statusBreakdown} />
                </div>
              </Panel>

              <Panel
                className='animate-fade-in-up opacity-0'
                style={{
                  animationDelay: '480ms',
                  animationFillMode: 'forwards',
                }}
              >
                <div className='p-5'>
                  <div className='mb-4 flex items-center gap-2'>
                    <BarChart3
                      size={14}
                      style={{ color: 'var(--app-accent)' }}
                    />
                    <p
                      className='text-sm font-bold'
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      By Priority
                    </p>
                  </div>
                  <PriorityBarChart data={data.priorityBreakdown} />
                </div>
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, RefreshCw, Search, Ticket } from 'lucide-react';

type TicketStatus = 'open' | 'in_progress' | 'pending' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface TicketRow {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const ALL_STATUS = ['all', 'open', 'in_progress', 'pending', 'closed'] as const;
const ALL_PRIORITIES = ['all', 'low', 'medium', 'high', 'critical'] as const;

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending: 'Pending',
  closed: 'Closed',
};

const STATUS_STYLE: Record<TicketStatus, { bg: string; color: string }> = {
  open: { bg: 'rgba(96,165,250,0.15)', color: '#93c5fd' },
  in_progress: { bg: 'rgba(251,191,36,0.15)', color: '#fcd34d' },
  pending: { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
  closed: { bg: 'rgba(74,222,128,0.15)', color: '#86efac' },
};

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  low: '#6b7280',
  medium: '#fb923c',
  high: '#f43f5e',
  critical: '#f43f5e',
};

const PRIORITY_GLOW: Record<TicketPriority, string> = {
  low: 'none',
  medium: '0 0 6px #fb923c',
  high: '0 0 6px #f43f5e',
  critical: '0 0 8px #f43f5e',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────
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
      className='rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 hover:-translate-y-0.5'
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

// ─── Glass Panel ──────────────────────────────────────────────────────────────
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
        className='h-[1px]'
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
        }}
      />
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (e) setError(e.message);
    else setTickets(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = tickets.filter((t) => {
    return (
      t.title.toLowerCase().includes(search.toLowerCase()) &&
      (status === 'all' || t.status === status) &&
      (priority === 'all' || t.priority === priority)
    );
  });

  return (
    <div
      className='relative min-h-screen space-y-6 p-8'
      style={{ background: '#06060f' }}
    >
      {/* Ambient glows */}
      <div
        className='pointer-events-none fixed inset-0 overflow-hidden'
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
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
            bottom: '0',
            right: '0',
            width: '30vw',
            height: '30vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
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
        {/* ── Header ── */}
        <div
          className='animate-fade-in-up opacity-0 mb-6 flex items-end justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <p
              className='mb-1 text-xs font-bold uppercase tracking-widest'
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Helpdesk
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
              Tickets
            </h1>
            <p
              className='mt-1 text-sm'
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {loading
                ? 'Loading…'
                : `${filtered.length} ticket${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link
            href='/tickets/new'
            className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90'
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow:
                '0 4px 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Plus size={14} /> New Ticket
          </Link>
        </div>

        {/* ── Filters ── */}
        <Panel
          className='animate-fade-in-up opacity-0 mb-4'
          style={{
            animationDelay: '80ms',
            animationFillMode: 'forwards',
          }}
        >
          <div className='flex flex-wrap items-center gap-3 p-4'>
            {/* Search */}
            <div className='relative min-w-[200px] flex-1'>
              <Search
                size={13}
                className='absolute left-3 top-1/2 -translate-y-1/2'
                style={{ color: 'rgba(255,255,255,0.25)' }}
              />
              <input
                placeholder='Search tickets…'
                className='h-9 w-full rounded-xl pl-9 pr-4 text-sm outline-none transition-all'
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status pills */}
            <div className='flex flex-wrap gap-1.5'>
              {ALL_STATUS.map((s) => (
                <Pill
                  key={s}
                  label={s === 'all' ? 'All' : STATUS_LABELS[s as TicketStatus]}
                  active={status === s}
                  onClick={() => setStatus(s)}
                />
              ))}
            </div>

            {/* Priority pills */}
            <div className='flex flex-wrap gap-1.5'>
              {ALL_PRIORITIES.map((p) => (
                <Pill
                  key={p}
                  label={p === 'all' ? 'All' : p}
                  active={priority === p}
                  onClick={() => setPriority(p)}
                />
              ))}
            </div>

            <button
              type='button'
              onClick={fetchTickets}
              disabled={loading}
              className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10'
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
            </button>
          </div>
        </Panel>

        {/* ── List ── */}
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
            <p className='text-sm font-bold text-white'>All Tickets</p>
            <p className='text-xs' style={{ color: 'rgba(255,255,255,0.3)' }}>
              Click a ticket to view details
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
              <Ticket size={36} />
              <p className='text-sm font-medium'>No tickets found</p>
              {(search || status !== 'all' || priority !== 'all') && (
                <button
                  type='button'
                  onClick={() => {
                    setSearch('');
                    setStatus('all');
                    setPriority('all');
                  }}
                  className='rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-white/10'
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!error &&
            filtered.map((ticket, i) => {
              const ss = STATUS_STYLE[ticket.status];
              return (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className='flex items-center gap-4 px-5 py-3.5 transition-all duration-150 hover:bg-white/[0.03]'
                  style={{
                    borderBottom:
                      i < filtered.length - 1
                        ? '1px solid rgba(255,255,255,0.04)'
                        : 'none',
                  }}
                >
                  {/* Priority dot */}
                  <span
                    className='h-2 w-2 shrink-0 rounded-full'
                    style={{
                      background: PRIORITY_COLOR[ticket.priority],
                      boxShadow: PRIORITY_GLOW[ticket.priority],
                    }}
                  />

                  {/* ID */}
                  <span
                    className='shrink-0 font-mono text-[11px] font-bold'
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    {ticket.id.slice(0, 8).toUpperCase()}
                  </span>

                  {/* Title */}
                  <span
                    className='flex-1 truncate text-sm font-medium'
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    {ticket.title}
                  </span>

                  {/* Status */}
                  <span
                    className='shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold'
                    style={{ background: ss.bg, color: ss.color }}
                  >
                    {STATUS_LABELS[ticket.status]}
                  </span>

                  {/* Priority */}
                  <span
                    className='shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold capitalize'
                    style={{
                      background: `${PRIORITY_COLOR[ticket.priority]}20`,
                      color: PRIORITY_COLOR[ticket.priority],
                    }}
                  >
                    {ticket.priority}
                  </span>

                  {/* Date */}
                  <span
                    className='hidden shrink-0 text-xs sm:block'
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    {formatDate(ticket.created_at)}
                  </span>
                </Link>
              );
            })}
        </Panel>
      </div>
    </div>
  );
}

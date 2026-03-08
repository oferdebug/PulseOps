'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Check, Plus, RefreshCw, Search, Ticket } from 'lucide-react';

type TicketStatus = 'open' | 'in_progress' | 'pending' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface AgentOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

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

const STATUS_BADGE: Record<TicketStatus, string> = {
  open: 'badge-open',
  in_progress: 'badge-progress',
  pending: 'badge-pending',
  closed: 'badge-closed',
};

const PRIORITY_DOT: Record<TicketPriority, string> = {
  low: 'dot-low',
  medium: 'dot-medium',
  high: 'dot-high',
  critical: 'dot-critical',
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
    <div className={`glass-card ${className}`} style={style}>
      <div className='card-accent-line' />
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { user } = useCurrentUser();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);
  const [savedTicketId, setSavedTicketId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

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

  useEffect(() => {
    console.log('user?.id:', user?.id);
    if (!user?.id) return;
    const supabase = createClient();
    Promise.all([
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => data?.role ?? null),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')
        .then(({ data }) => data ?? []),
    ]).then(([role, agentList]) => {
      setUserRole(role === 'admin' || role === 'agent' ? role : null);
      setAgents((agentList ?? []) as AgentOption[]);
    });
  }, [user?.id]);

  async function handleAssignChange(
    ticketId: string,
    newAssignedTo: string | null,
  ) {
    setAssigningId(ticketId);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('tickets')
      .update({ assigned_to: newAssignedTo })
      .eq('id', ticketId);
    if (!err) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, assigned_to: newAssignedTo } : t,
        ),
      );
      setSavedTicketId(ticketId);
      setTimeout(() => setSavedTicketId(null), 2000);
    }
    setAssigningId(null);
  }

  function assigneeDisplay(ticket: TicketRow): string {
    if (!ticket.assigned_to) return 'Unassigned';
    const a = agents.find((x) => x.id === ticket.assigned_to);
    return a?.full_name?.trim() || a?.email || 'Unassigned';
  }

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
      style={{ background: 'var(--app-bg)' }}
    >
      <div
        className='app-mesh pointer-events-none fixed inset-0 overflow-hidden'
        style={{ zIndex: 0 }}
      />

      <div className='relative' style={{ zIndex: 1 }}>
        {/* ── Header ── */}
        <div
          className='animate-fade-in-up opacity-0 mb-6 flex items-end justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <p
              className='mb-1 text-xs font-bold uppercase tracking-widest'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Helpdesk
            </p>
            <h1 className='text-4xl font-black tracking-tight text-gradient-primary'>
              Tickets
            </h1>
            <p
              className='mt-1 text-sm'
              style={{ color: 'var(--app-text-muted)' }}
            >
              {loading
                ? 'Loading…'
                : `${filtered.length} ticket${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link
            href='/tickets/new'
            className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90'
            style={{
              background: 'var(--app-accent)',
              color: 'var(--primary-foreground)',
              boxShadow: '0 4px 20px var(--app-accent-dim)',
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
                style={{ color: 'var(--app-text-muted)' }}
              />
              <input
                placeholder='Search tickets…'
                className='h-9 w-full rounded-xl pl-9 pr-4 text-sm outline-none transition-all'
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text-primary)',
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
              className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-(--app-surface-raised)'
              style={{ color: 'var(--app-text-muted)' }}
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
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              All Tickets
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Click a ticket to view details
            </p>
          </div>

          {error && (
            <div
              className='mx-5 my-3 rounded-xl px-4 py-3 text-sm'
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
                  className='rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-(--app-surface-raised)'
                  style={{
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-nav-idle-text)',
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!error &&
            filtered.map((ticket, i) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className='flex items-center gap-4 px-5 py-3.5 transition-all duration-150 hover:bg-(--app-surface-raised)'
                style={{
                  borderBottom:
                    i < filtered.length - 1
                      ? '1px solid var(--app-border)'
                      : 'none',
                }}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('[data-assign-cell]')) {
                    e.preventDefault();
                  }
                }}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[ticket.priority]}`}
                />
                <span
                  className='shrink-0 font-mono text-[11px] font-bold'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  {ticket.id.slice(0, 8).toUpperCase()}
                </span>
                <span
                  className='flex-1 truncate text-sm font-medium'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  {ticket.title}
                </span>
                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[ticket.status]}`}
                >
                  {STATUS_LABELS[ticket.status]}
                </span>
                <span
                  className='shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold capitalize'
                  style={{
                    background: `color-mix(in srgb, var(--app-priority-${ticket.priority}) 15%, transparent)`,
                    color: `var(--app-priority-${ticket.priority})`,
                  }}
                >
                  {ticket.priority}
                </span>
                <span
                  className='flex shrink-0 items-center gap-1.5'
                  data-assign-cell
                >
                  {userRole === 'admin' && agents.length > 0 ? (
                    <>
                      <select
                        value={ticket.assigned_to ?? ''}
                        onChange={(e) => {
                          handleAssignChange(ticket.id, e.target.value || null);
                        }}
                        disabled={assigningId === ticket.id}
                        className='min-w-[100px] max-w-[140px] rounded-lg px-2 py-1 text-[11px] outline-none disabled:opacity-60'
                        style={{
                          background: 'var(--app-surface)',
                          border: '1px solid var(--app-border)',
                          color: 'var(--app-text-primary)',
                        }}
                      >
                        <option value=''>Unassigned</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.full_name?.trim() || a.email || a.id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                      {savedTicketId === ticket.id && (
                        <span
                          className='shrink-0 text-xs font-bold'
                          style={{ color: 'var(--app-health-healthy)' }}
                        >
                          <Check size={12} />
                        </span>
                      )}
                    </>
                  ) : (
                    <span
                      className='text-xs'
                      style={{ color: 'var(--app-text-muted)' }}
                    >
                      {assigneeDisplay(ticket)}
                    </span>
                  )}
                </span>
                <span
                  className='hidden shrink-0 text-xs sm:block'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  {formatDate(ticket.created_at)}
                </span>
              </Link>
            ))}
        </Panel>
      </div>
    </div>
  );
}

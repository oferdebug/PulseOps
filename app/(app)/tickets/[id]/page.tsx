'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Clock,
  Hourglass,
  Loader2,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';

interface AgentOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

type TicketStatus = 'open' | 'in_progress' | 'pending' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface TicketRow {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  created_by: string | null;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending: 'Pending',
  closed: 'Closed',
};
const STATUS_ICONS: Record<TicketStatus, React.ElementType> = {
  open: CircleDot,
  in_progress: Hourglass,
  pending: AlertTriangle,
  closed: CheckCircle2,
};
const STATUS_BADGE: Record<TicketStatus, string> = {
  open: 'badge-open',
  in_progress: 'badge-progress',
  pending: 'badge-pending',
  closed: 'badge-closed',
};
const _PRIORITY_DOT: Record<TicketPriority, string> = {
  low: 'dot-low',
  medium: 'dot-medium',
  high: 'dot-high',
  critical: 'dot-critical',
};
const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress', 'pending', 'closed'],
  in_progress: ['pending', 'closed'],
  pending: ['in_progress', 'closed'],
  closed: ['open'],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className='glass-card'>
      <div className='card-accent-line' />
      {children}
    </div>
  );
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();
  const { log } = useActivityLogger();
  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileAgentsLoading, setProfileAgentsLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setTicket(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!user?.id) {
      setProfileAgentsLoading(false);
      return;
    }
    const supabase = createClient();
    Promise.all([
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => data?.role === 'admin'),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')
        .then(({ data }) => data ?? []),
    ]).then(([admin, agentList]) => {
      setIsAdmin(!!admin);
      setAgents(agentList as AgentOption[]);
      setProfileAgentsLoading(false);
    });
  }, [user?.id]);

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!ticket) return;
    const prev = ticket.status;
    setTicket((t) => (t ? { ...t, status: newStatus } : t));
    setUpdating(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', id);
    if (err) {
      setTicket((t) => (t ? { ...t, status: prev } : t));
      setError(err.message);
    } else
      await log({
        action: 'updated',
        entity: 'ticket',
        entity_id: id,
        description: `Changed status: ${STATUS_LABELS[prev]} → ${STATUS_LABELS[newStatus]}`,
        metadata: { from: prev, to: newStatus },
      });
    setUpdating(false);
  }

  async function handleAssignmentChange(newAssignedTo: string | null) {
    if (!ticket) return;
    setAssigning(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('tickets')
      .update({ assigned_to: newAssignedTo })
      .eq('id', id);
    if (err) {
      setError(err.message);
      setAssigning(false);
      return;
    }
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setTicket(data);
    setAssignmentSuccess(true);
    setTimeout(() => setAssignmentSuccess(false), 3000);
    setAssigning(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    setDeleting(true);
    const supabase = createClient();
    const { error: err } = await supabase.from('tickets').delete().eq('id', id);
    if (err) {
      setError(err.message);
      setDeleting(false);
      return;
    }
    await log({
      action: 'deleted',
      entity: 'ticket',
      entity_id: id,
      description: `Deleted ticket: ${ticket?.title}`,
    });
    router.push('/tickets');
  }

  if (loading)
    return (
      <div
        className='flex min-h-screen items-center justify-center'
        style={{ background: 'var(--app-bg)' }}
      >
        <Loader2
          size={28}
          className='animate-spin'
          style={{ color: 'var(--app-accent)' }}
        />
      </div>
    );

  if (error || !ticket)
    return (
      <div className='min-h-screen p-8' style={{ background: 'var(--app-bg)' }}>
        <div
          className='rounded-xl px-4 py-3 text-sm'
          style={{
            background:
              'color-mix(in srgb, var(--destructive) 12%, transparent)',
            border:
              '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
            color: 'var(--destructive)',
          }}
        >
          {error ?? 'Ticket not found.'}
        </div>
      </div>
    );

  const StatusIcon = STATUS_ICONS[ticket.status];
  const nextStatuses = STATUS_TRANSITIONS[ticket.status];
  const statusBadgeClass = STATUS_BADGE[ticket.status];

  return (
    <div
      className='relative min-h-screen p-8'
      style={{ background: 'var(--app-bg)' }}
    >
      <div
        className='app-mesh pointer-events-none fixed inset-0'
        style={{ zIndex: 0 }}
      />

      <div
        className='relative mx-auto max-w-2xl space-y-6'
        style={{ zIndex: 1 }}
      >
        <Link
          href='/tickets'
          className='inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-(--app-surface-raised)'
          style={{
            border: '1px solid var(--app-border)',
            color: 'var(--app-nav-idle-text)',
          }}
        >
          <ArrowLeft size={13} /> Back to Tickets
        </Link>

        <Panel>
          <div className='space-y-4 p-6'>
            {/* ID + Title */}
            <div>
              <p
                className='mb-1 font-mono text-xs font-bold'
                style={{ color: 'var(--app-text-faint)' }}
              >
                {ticket.id.slice(0, 8).toUpperCase()}
              </p>
              <h1
                className='text-2xl font-black tracking-tight'
                style={{ color: 'var(--app-text-primary)' }}
              >
                {ticket.title}
              </h1>
            </div>

            {/* Status + Priority row */}
            <div className='flex flex-wrap items-center gap-3'>
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${statusBadgeClass}`}
              >
                <StatusIcon size={13} />
                <span className='text-xs font-bold'>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <div
                className='rounded-xl px-3 py-1.5'
                style={{
                  background: `color-mix(in srgb, var(--app-priority-${ticket.priority}) 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, var(--app-priority-${ticket.priority}) 30%, transparent)`,
                  color: `var(--app-priority-${ticket.priority})`,
                }}
              >
                <span className='text-xs font-bold capitalize'>
                  {ticket.priority}
                </span>
              </div>
            </div>

            {/* Meta */}
            <div
              className='flex flex-wrap gap-4 text-xs'
              style={{ color: 'var(--app-text-muted)' }}
            >
              <span className='flex items-center gap-1.5'>
                <Clock size={12} /> Created {formatDate(ticket.created_at)}
              </span>
              <span className='flex items-center gap-1.5'>
                <Clock size={12} /> Updated {formatDate(ticket.updated_at)}
              </span>
              {ticket.created_by && (
                <span className='flex items-center gap-1.5'>
                  <User size={12} /> {ticket.created_by.slice(0, 8)}
                </span>
              )}
            </div>

            {/* Assigned To */}
            <div
              style={{
                borderTop: '1px solid var(--app-border)',
                paddingTop: '16px',
              }}
            >
              <p
                className='mb-2 text-[11px] font-bold uppercase tracking-widest'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Assigned To
              </p>
              {profileAgentsLoading ? (
                <span
                  className='text-sm'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  …
                </span>
              ) : isAdmin ? (
                <div className='flex flex-wrap items-center gap-2'>
                  <select
                    value={ticket.assigned_to ?? ''}
                    onChange={(e) =>
                      handleAssignmentChange(e.target.value || null)
                    }
                    disabled={assigning}
                    className='rounded-xl px-3 py-2 text-sm outline-none transition-[border-color] disabled:opacity-60'
                    style={{
                      background: 'var(--app-surface)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-text-primary)',
                      minWidth: '200px',
                    }}
                  >
                    <option value=''>Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name?.trim() || a.email || a.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                  {assigning && (
                    <Loader2
                      size={16}
                      className='animate-spin'
                      style={{ color: 'var(--app-accent)' }}
                    />
                  )}
                  {assignmentSuccess && (
                    <span
                      className='text-xs font-semibold'
                      style={{ color: 'var(--app-health-healthy)' }}
                    >
                      Saved
                    </span>
                  )}
                </div>
              ) : (
                <span
                  className='text-sm'
                  style={{ color: 'var(--app-text-secondary)' }}
                >
                  {ticket.assigned_to
                    ? agents
                        .find((a) => a.id === ticket.assigned_to)
                        ?.full_name?.trim() ||
                      agents.find((a) => a.id === ticket.assigned_to)?.email ||
                      'Unassigned'
                    : 'Unassigned'}
                </span>
              )}
            </div>

            {/* Description */}
            <div
              style={{
                borderTop: '1px solid var(--app-border)',
                paddingTop: '20px',
              }}
            >
              {ticket.description ? (
                <p
                  className='whitespace-pre-wrap text-sm leading-relaxed'
                  style={{ color: 'var(--app-text-secondary)' }}
                >
                  {ticket.description}
                </p>
              ) : (
                <p
                  className='text-sm italic'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  No description provided.
                </p>
              )}
            </div>

            {/* Status transitions */}
            <div
              style={{
                borderTop: '1px solid var(--app-border)',
                paddingTop: '20px',
              }}
            >
              <p
                className='mb-3 text-[11px] font-bold uppercase tracking-widest'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Change Status
              </p>
              <div className='flex flex-wrap gap-2'>
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    type='button'
                    onClick={() => handleStatusChange(s)}
                    disabled={updating || deleting}
                    className='flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-40'
                    style={
                      s === 'closed'
                        ? {
                            background: 'var(--app-surface)',
                            border: '1px solid var(--app-border)',
                            color: 'var(--app-text-secondary)',
                          }
                        : {
                            background: 'var(--app-accent)',
                            color: 'var(--primary-foreground)',
                            boxShadow: '0 4px 15px var(--app-accent-dim)',
                          }
                    }
                  >
                    {updating && <Loader2 size={12} className='animate-spin' />}
                    {s === 'closed' ? 'Close Ticket' : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete */}
            <div
              className='flex justify-end'
              style={{
                borderTop: '1px solid var(--app-border)',
                paddingTop: '16px',
              }}
            >
              <button
                type='button'
                onClick={handleDelete}
                disabled={deleting}
                className='flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:bg-(--app-logout-hover)'
                style={{ color: 'var(--destructive)' }}
              >
                {deleting ? (
                  <Loader2 size={12} className='animate-spin' />
                ) : (
                  <Trash2 size={12} />
                )}
                Delete Ticket
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

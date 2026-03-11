'use client';

import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  Hourglass,
  Loader2,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import FileUpload from '@/components/features/attachments/FileUpload';
import { CommentSection } from '@/components/features/comments/CommentSection';
import { SLAIndicator } from '@/components/features/sla/SLAIndicator';
import { TagInput } from '@/components/features/tags/TagInput';
import { TicketTimeline } from '@/components/features/timeline/TicketTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTicketSLA } from '@/hooks/useSLA';
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
  const { sla } = useTicketSLA(id);

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
      toast.error(err.message);
    } else {
      toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`);
      await log({
        action: 'updated',
        entity: 'ticket',
        entity_id: id,
        description: `Changed status: ${STATUS_LABELS[prev]} → ${STATUS_LABELS[newStatus]}`,
        metadata: { from: prev, to: newStatus },
      });
    }
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
      toast.error(err.message);
      setAssigning(false);
      return;
    }
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setTicket(data);
    toast.success('Assignment updated');
    setAssigning(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    setDeleting(true);
    const supabase = createClient();
    const { error: err } = await supabase.from('tickets').delete().eq('id', id);
    if (err) {
      toast.error(err.message);
      setDeleting(false);
      return;
    }
    await log({
      action: 'deleted',
      entity: 'ticket',
      entity_id: id,
      description: `Deleted ticket: ${ticket?.title}`,
    });
    toast.success('Ticket deleted');
    router.push('/tickets');
  }

  if (loading)
    return (
      <div className='min-h-screen p-8' style={{ background: 'var(--app-bg)' }}>
        <div className='mx-auto max-w-2xl space-y-6'>
          <Skeleton className='h-8 w-32 rounded-md' />
          <div className='glass-card p-6 space-y-4'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-8 w-3/4' />
            <div className='flex gap-3'>
              <Skeleton className='h-7 w-24 rounded-md' />
              <Skeleton className='h-7 w-20 rounded-md' />
            </div>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-20 w-full' />
          </div>
        </div>
      </div>
    );

  if (error || !ticket)
    return (
      <div className='min-h-screen p-8' style={{ background: 'var(--app-bg)' }}>
        <div
          className='rounded-md px-4 py-3 text-sm'
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
      className='min-h-screen p-8'
      style={{ background: 'var(--app-bg)' }}
    >

      <div
        className='mx-auto max-w-2xl space-y-6'
       
      >
        <AppBreadcrumb current={ticket.title} />

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
                className='text-2xl font-bold tracking-tight'
                style={{ color: 'var(--app-text-primary)' }}
              >
                {ticket.title}
              </h1>
            </div>

            {/* Status + Priority row */}
            <div className='flex flex-wrap items-center gap-3'>
              <div
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 ${statusBadgeClass}`}
              >
                <StatusIcon size={13} />
                <span className='text-xs font-bold'>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <div
                className='rounded-md px-3 py-1.5'
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
                className='mb-2 text-xs font-medium'
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
                    className='rounded-md px-3 py-2 text-sm outline-none transition-[border-color] disabled:opacity-60'
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

            {/* Tags */}
            <div
              style={{
                borderTop: '1px solid var(--app-border)',
                paddingTop: '16px',
              }}
            >
              <p
                className='mb-2 text-xs font-medium'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Tags
              </p>
              <TagInput entityType='ticket' entityId={id} />
            </div>

            {/* Attachments */}
            <div
              style={{
                borderTop: '1px solid var(--app-border)',
                paddingTop: '16px',
              }}
            >
              <p
                className='mb-2 text-xs font-medium'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Attachments
              </p>
              <FileUpload entityType='ticket' entityId={id} />
            </div>

            {/* Status transitions */}
            <div
              style={{
                borderTop: '1px solid var(--app-border)',
                paddingTop: '20px',
              }}
            >
              <p
                className='mb-3 text-xs font-medium'
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
                    className='flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-40'
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
                className='flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-all hover:bg-(--app-logout-hover)'
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

        {/* SLA */}
        {sla && (
          <Panel>
            <div className='p-6'>
              <p
                className='mb-3 text-xs font-medium'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Service Level Agreement
              </p>
              <SLAIndicator sla={sla} />
            </div>
          </Panel>
        )}

        {/* Comments */}
        <Panel>
          <div className='p-6'>
            <CommentSection ticketId={id} canAddInternal={isAdmin} />
          </div>
        </Panel>

        {/* History Timeline */}
        <Panel>
          <div className='p-6'>
            <p
              className='mb-3 text-xs font-medium'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Activity History
            </p>
            <TicketTimeline ticketId={id} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

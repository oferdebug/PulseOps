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
import { createClient } from '@/lib/supabase/client';

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
const STATUS_COLOR: Record<TicketStatus, string> = {
  open: '#60a5fa',
  in_progress: '#fbbf24',
  pending: '#fb923c',
  closed: '#4ade80',
};
const PRIORITY_COLOR: Record<TicketPriority, string> = {
  low: '#6b7280',
  medium: '#fb923c',
  high: '#f43f5e',
  critical: '#f43f5e',
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
    <div
      className='overflow-hidden rounded-2xl'
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className='h-px'
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
        }}
      />
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
  const { log } = useActivityLogger();
  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        style={{ background: '#06060f' }}
      >
        <Loader2
          size={28}
          className='animate-spin'
          style={{ color: '#6366f1' }}
        />
      </div>
    );

  if (error || !ticket)
    return (
      <div className='min-h-screen p-8' style={{ background: '#06060f' }}>
        <div
          className='rounded-xl px-4 py-3 text-sm'
          style={{
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.2)',
            color: '#fca5a5',
          }}
        >
          {error ?? 'Ticket not found.'}
        </div>
      </div>
    );

  const StatusIcon = STATUS_ICONS[ticket.status];
  const nextStatuses = STATUS_TRANSITIONS[ticket.status];

  return (
    <div
      className='relative min-h-screen p-8'
      style={{ background: '#06060f' }}
    >
      <div className='pointer-events-none fixed inset-0' style={{ zIndex: 0 }}>
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
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div
        className='relative mx-auto max-w-2xl space-y-6'
        style={{ zIndex: 1 }}
      >
        <Link
          href='/tickets'
          className='inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-white/5'
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)',
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
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                {ticket.id.slice(0, 8).toUpperCase()}
              </p>
              <h1 className='text-2xl font-black tracking-tight text-white'>
                {ticket.title}
              </h1>
            </div>

            {/* Status + Priority row */}
            <div className='flex flex-wrap items-center gap-3'>
              <div
                className='flex items-center gap-2 rounded-xl px-3 py-1.5'
                style={{
                  background: `${STATUS_COLOR[ticket.status]}15`,
                  border: `1px solid ${STATUS_COLOR[ticket.status]}30`,
                }}
              >
                <StatusIcon
                  size={13}
                  style={{ color: STATUS_COLOR[ticket.status] }}
                />
                <span
                  className='text-xs font-bold'
                  style={{ color: STATUS_COLOR[ticket.status] }}
                >
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <div
                className='rounded-xl px-3 py-1.5'
                style={{
                  background: `${PRIORITY_COLOR[ticket.priority]}15`,
                  border: `1px solid ${PRIORITY_COLOR[ticket.priority]}30`,
                }}
              >
                <span
                  className='text-xs font-bold capitalize'
                  style={{ color: PRIORITY_COLOR[ticket.priority] }}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>

            {/* Meta */}
            <div
              className='flex flex-wrap gap-4 text-xs'
              style={{ color: 'rgba(255,255,255,0.25)' }}
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

            {/* Description */}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '20px',
              }}
            >
              {ticket.description ? (
                <p
                  className='whitespace-pre-wrap text-sm leading-relaxed'
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {ticket.description}
                </p>
              ) : (
                <p
                  className='text-sm italic'
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  No description provided.
                </p>
              )}
            </div>

            {/* Status transitions */}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '20px',
              }}
            >
              <p
                className='mb-3 text-[11px] font-bold uppercase tracking-widest'
                style={{ color: 'rgba(255,255,255,0.25)' }}
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
                    className='flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40'
                    style={
                      s === 'closed'
                        ? {
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.6)',
                          }
                        : {
                            background:
                              'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
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
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '16px',
              }}
            >
              <button
                type='button'
                onClick={handleDelete}
                disabled={deleting}
                className='flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:bg-red-500/15'
                style={{ color: '#f87171' }}
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

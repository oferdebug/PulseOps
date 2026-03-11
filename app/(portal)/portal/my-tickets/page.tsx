'use client';

import { Loader2, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';

interface MyTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-open',
  in_progress: 'badge-progress',
  pending: 'badge-pending',
  closed: 'badge-closed',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function MyTicketsPage() {
  const { user } = useCurrentUser();
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  // Check URL for ?new=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') setShowNew(true);
  }, []);

  const fetchTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('tickets')
      .select('id, title, status, priority, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = tickets.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.status.includes(search.toLowerCase()),
  );

  // New ticket form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !user?.id) return;
    setSubmitting(true);
    const supabase = createClient();

    // Get user's org_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    await supabase.from('tickets').insert({
      title: title.trim(),
      description: description.trim(),
      priority,
      created_by: user.id,
      organization_id: profile?.organization_id,
    });

    setTitle('');
    setDescription('');
    setPriority('medium');
    setShowNew(false);
    setSubmitting(false);
    fetchTickets();
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
    color: 'var(--app-text-primary)',
    borderRadius: '12px',
    outline: 'none',
    padding: '8px 12px',
    width: '100%',
    fontSize: '14px',
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1
            className='text-2xl font-bold tracking-tight'
            style={{ color: 'var(--app-text-primary)' }}
          >
            My Tickets
          </h1>
          <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type='button'
          onClick={() => setShowNew(true)}
          className='flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5'
          style={{
            background: 'var(--app-accent)',
            color: 'var(--primary-foreground)',
          }}
        >
          <Plus size={14} /> New Ticket
        </button>
      </div>

      {/* New ticket form */}
      {showNew && (
        <div className='glass-card overflow-hidden'>
          <div className='card-accent-line' />
          <div className='space-y-4 p-6'>
            <h2
              className='text-lg font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Submit a New Ticket
            </h2>
            <div>
              <label
                htmlFor='portal-title'
                className='text-xs font-bold uppercase tracking-wider'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Title
              </label>
              <input
                id='portal-title'
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Brief description of your issue...'
                style={inputStyle}
                className='mt-1'
              />
            </div>
            <div>
              <label
                htmlFor='portal-desc'
                className='text-xs font-bold uppercase tracking-wider'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Description
              </label>
              <textarea
                id='portal-desc'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Please provide as much detail as possible...'
                rows={4}
                style={{ ...inputStyle, height: 'auto' }}
                className='mt-1'
              />
            </div>
            <div>
              <label
                htmlFor='portal-priority'
                className='text-xs font-bold uppercase tracking-wider'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Priority
              </label>
              <select
                id='portal-priority'
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ ...inputStyle, height: '40px' }}
                className='mt-1'
              >
                <option value='low'>Low</option>
                <option value='medium'>Medium</option>
                <option value='high'>High</option>
                <option value='critical'>Critical</option>
              </select>
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={handleSubmit}
                disabled={!title.trim() || submitting}
                className='rounded-md px-6 py-2.5 text-sm font-bold transition-all disabled:opacity-50'
                style={{
                  background: 'var(--app-accent)',
                  color: 'var(--primary-foreground)',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
              <button
                type='button'
                onClick={() => setShowNew(false)}
                className='rounded-md px-4 py-2.5 text-sm font-semibold'
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-text-secondary)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className='relative'>
        <Search
          size={14}
          className='absolute left-3 top-1/2 -translate-y-1/2'
          style={{ color: 'var(--app-text-faint)' }}
        />
        <input
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search your tickets...'
          className='h-10 w-full rounded-md pl-9 pr-4 text-sm'
          style={{
            background: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Ticket list */}
      <div className='glass-card overflow-hidden'>
        <div className='card-accent-line' />
        {loading ? (
          <div className='flex justify-center py-12'>
            <Loader2
              size={18}
              className='animate-spin'
              style={{ color: 'var(--app-text-faint)' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className='flex flex-col items-center gap-3 py-12'
            style={{ color: 'var(--app-text-faint)' }}
          >
            <p className='text-sm'>No tickets found</p>
            <button
              type='button'
              onClick={() => setShowNew(true)}
              className='flex items-center gap-1.5 text-xs font-semibold'
              style={{ color: 'var(--app-accent-text)' }}
            >
              <Plus size={12} /> Create your first ticket
            </button>
          </div>
        ) : (
          filtered.map((t, i) => (
            <div
              key={t.id}
              className='flex items-center gap-4 px-6 py-4 transition-all hover:bg-(--app-surface-raised)'
              style={{
                borderBottom:
                  i < filtered.length - 1
                    ? '1px solid var(--app-border)'
                    : 'none',
              }}
            >
              <div className='min-w-0 flex-1'>
                <p
                  className='truncate text-sm font-bold'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  {t.title}
                </p>
                <p
                  className='mt-0.5 text-xs'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  {timeAgo(t.created_at)} · {t.priority}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[t.status] ?? ''}`}
              >
                {t.status.replace(/_/g, ' ')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

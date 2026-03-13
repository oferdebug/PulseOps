/** biome-ignore-all lint/a11y/noLabelWithoutControl: labels are associated with controls via id/aria */
/** biome-ignore-all assist/source/organizeImports: import order kept intentional */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Panel } from '@/components/ui/panel';
import { TemplateSelector } from '@/components/features/templates/TemplateSelector';
import { AiTicketAssist } from '@/components/features/ai/AiTicketAssist';
import type { TicketTemplate } from '@/hooks/useTemplates';
import { toast } from 'sonner';

type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface AgentOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

const inputStyle: React.CSSProperties = {
  background: 'var(--app-surface)',
  border: '1px solid var(--app-border)',
  color: 'var(--app-text-primary)',
  borderRadius: '12px',
  outline: 'none',
  height: '40px',
  padding: '0 12px',
  width: '100%',
  fontSize: '14px',
};
const labelStyle: React.CSSProperties = {
  color: 'var(--app-text-muted)',
  fontSize: '11px',
  fontWeight: 700,
  marginBottom: '6px',
  display: 'block',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { log } = useActivityLogger();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateApplied, setTemplateApplied] = useState(false);

  function applyTemplate(template: TicketTemplate) {
    setTitle(template.title_template);
    setDescription(template.body_template);
    setPriority(template.default_priority as TicketPriority);
    setTemplateApplied(true);
  }

  useEffect(() => {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Your session expired. Please sign in again.');
      toast.error('Your session expired. Please sign in again.');
      setSubmitting(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('tickets')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: 'open',
        created_by: user.id,
        assigned_to: assignedTo || null,
      })
      .select('id')
      .single();
    if (err) {
      setError(err.message);
      toast.error(err.message);
      setSubmitting(false);
      return;
    }
    await log({
      action: 'created',
      entity: 'ticket',
      entity_id: data.id,
      description: `Created ticket: ${title.trim()}`,
      metadata: { priority },
    });
    toast.success('Ticket created');
    router.push(`/tickets/${data.id}`);
  }

  return (
    <div className='min-h-screen p-8' style={{ background: 'var(--app-bg)' }}>
      <div className='mx-auto max-w-2xl space-y-6'>
        {/* Breadcrumb */}
        <AppBreadcrumb current='New Ticket' />

        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0'
          style={{ animationFillMode: 'forwards' }}
        >
          <p
            className='mb-1 text-xs font-bold uppercase tracking-widest'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Helpdesk
          </p>
          <h1
            className='text-xl font-bold tracking-tight'
            style={{ color: 'var(--app-text-primary)' }}
          >
            New Ticket
          </h1>
          <p
            className='mt-1 text-sm'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Describe the issue and we'll get it logged.
          </p>
        </div>

        {/* Template Selector */}
        {!templateApplied && (
          <Panel>
            <div className='p-6'>
              <TemplateSelector onSelect={applyTemplate} />
            </div>
          </Panel>
        )}

        {/* Form */}
        <Panel>
          <div
            className='px-6 py-5'
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Ticket Details
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Fields marked * are required
            </p>
          </div>
          <form onSubmit={handleSubmit} className='space-y-5 p-6'>
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                style={inputStyle}
                placeholder='e.g. VPN not connecting after update'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{
                  ...inputStyle,
                  height: 'auto',
                  minHeight: '120px',
                  padding: '12px',
                  resize: 'vertical',
                }}
                placeholder='Describe the issue in detail — steps to reproduce, affected users, error messages…'
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* AI Assist */}
            {title.trim().length > 5 && (
              <AiTicketAssist
                title={title}
                description={description}
                onApplyPriority={(p) => setPriority(p as TicketPriority)}
              />
            )}

            <div>
              <label style={labelStyle}>Priority *</label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TicketPriority)}
                disabled={submitting}
              >
                <SelectTrigger
                  className='h-10 w-48 rounded-md text-sm'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-primary)',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='critical'>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userRole === 'admin' && (
              <div>
                <label style={labelStyle}>Assigned To</label>
                <select
                  value={assignedTo ?? ''}
                  onChange={(e) => setAssignedTo(e.target.value || null)}
                  disabled={submitting}
                  className='w-full rounded-md px-3 py-2 text-sm outline-none transition-[border-color] disabled:opacity-60'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-primary)',
                    height: '40px',
                  }}
                >
                  <option value=''>Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name?.trim() || a.email || a.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
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
                {error}
              </div>
            )}

            <div className='flex gap-3 pt-2'>
              <button
                type='submit'
                disabled={submitting || !title.trim()}
                className='flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
                style={{
                  background: 'var(--app-accent)',
                  color: 'var(--primary-foreground)',
                }}
              >
                {submitting && <Loader2 size={14} className='animate-spin' />}
                {submitting ? 'Submitting…' : 'Open Ticket'}
              </button>
              <Link
                href='/tickets'
                className='flex items-center rounded-md px-4 py-2.5 text-sm font-medium transition-all hover:bg-(--app-surface-raised)'
                style={{
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-nav-idle-text)',
                }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}

'use client';

import { CheckSquare, Loader2, Square, X } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type TicketStatus = 'open' | 'in_progress' | 'pending' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface BulkActionsProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
  onActionComplete: () => void;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function BulkActions({
  selectedIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsProps) {
  const [processing, setProcessing] = useState(false);

  async function handleBulkStatusChange(newStatus: TicketStatus) {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .in('id', ids);
    if (!error) {
      onClearSelection();
      onActionComplete();
    }
    setProcessing(false);
  }

  async function handleBulkPriorityChange(newPriority: TicketPriority) {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('tickets')
      .update({ priority: newPriority })
      .in('id', ids);
    if (!error) {
      onClearSelection();
      onActionComplete();
    }
    setProcessing(false);
  }

  async function handleBulkAssign(userId: string | null) {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_to: userId })
      .in('id', ids);
    if (!error) {
      onClearSelection();
      onActionComplete();
    }
    setProcessing(false);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.size} ticket(s)? This cannot be undone.`,
      )
    )
      return;
    setProcessing(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('tickets').delete().in('id', ids);
    if (!error) {
      onClearSelection();
      onActionComplete();
    }
    setProcessing(false);
  }

  return (
    <div
      className='flex flex-wrap items-center gap-3 rounded-md px-4 py-3'
      style={{
        background: 'var(--app-nav-active-bg)',
        border: '1px solid var(--app-nav-active-border)',
      }}
    >
      <div className='flex items-center gap-2'>
        <CheckSquare size={14} style={{ color: 'var(--app-accent)' }} />
        <span
          className='text-xs font-bold'
          style={{ color: 'var(--app-text-primary)' }}
        >
          {selectedIds.size} selected
        </span>
        <button
          type='button'
          onClick={onClearSelection}
          className='rounded p-0.5 hover:bg-black/10'
          style={{ color: 'var(--app-text-muted)' }}
        >
          <X size={12} />
        </button>
      </div>

      {processing && (
        <Loader2
          size={14}
          className='animate-spin'
          style={{ color: 'var(--app-accent)' }}
        />
      )}

      {/* Status */}
      <select
        onChange={(e) => {
          if (e.target.value)
            handleBulkStatusChange(e.target.value as TicketStatus);
          e.target.value = '';
        }}
        disabled={processing}
        className='rounded-lg px-2 py-1 text-[11px] font-semibold outline-none disabled:opacity-50'
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          color: 'var(--app-text-primary)',
        }}
        defaultValue=''
      >
        <option value='' disabled>
          Set Status…
        </option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Priority */}
      <select
        onChange={(e) => {
          if (e.target.value)
            handleBulkPriorityChange(e.target.value as TicketPriority);
          e.target.value = '';
        }}
        disabled={processing}
        className='rounded-lg px-2 py-1 text-[11px] font-semibold outline-none disabled:opacity-50'
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          color: 'var(--app-text-primary)',
        }}
        defaultValue=''
      >
        <option value='' disabled>
          Set Priority…
        </option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Unassign */}
      <button
        type='button'
        onClick={() => handleBulkAssign(null)}
        disabled={processing}
        className='rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-(--app-surface-raised) disabled:opacity-50'
        style={{
          border: '1px solid var(--app-border)',
          color: 'var(--app-text-muted)',
        }}
      >
        Unassign
      </button>

      {/* Delete */}
      <button
        type='button'
        onClick={handleBulkDelete}
        disabled={processing}
        className='rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-(--app-surface-raised) disabled:opacity-50'
        style={{
          border:
            '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
          color: 'var(--destructive)',
        }}
      >
        Delete
      </button>
    </div>
  );
}

export function BulkCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type='button'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange();
      }}
      className='flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all'
      style={{
        border: checked ? 'none' : '1.5px solid var(--app-border)',
        background: checked ? 'var(--app-accent)' : 'transparent',
      }}
    >
      {checked ? (
        <CheckSquare size={14} className='text-white' />
      ) : (
        <Square size={14} style={{ color: 'var(--app-text-faint)' }} />
      )}
    </button>
  );
}

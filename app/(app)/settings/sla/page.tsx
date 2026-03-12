/** biome-ignore-all lint/a11y/noLabelWithoutControl: labels are visually associated in this compact settings layout */
'use client';

import { ArrowLeft, Clock, Loader2, Save, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Panel } from '@/components/ui/panel';
import { type SLARule, useSLARules } from '@/hooks/useSLA';

function RuleRow({
  rule,
  onSave,
}: {
  rule: SLARule;
  onSave: (id: string, updates: Partial<SLARule>) => Promise<void>;
}) {
  const [response, setResponse] = useState(String(rule.first_response_hours));
  const [resolution, setResolution] = useState(String(rule.resolution_hours));
  const [escalation, setEscalation] = useState(
    String(rule.escalation_hours ?? ''),
  );
  const [active, setActive] = useState(rule.is_active);
  const [saving, setSaving] = useState(false);

  const dirty =
    Number(response) !== rule.first_response_hours ||
    Number(resolution) !== rule.resolution_hours ||
    Number(escalation || 0) !== (rule.escalation_hours ?? 0) ||
    active !== rule.is_active;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(rule.id, {
        first_response_hours: Number(response),
        resolution_hours: Number(resolution),
        escalation_hours: escalation ? Number(escalation) : null,
        is_active: active,
      });
    } catch (err) {
      console.error('Failed to save SLA rule:', err);
    } finally {
      setSaving(false);
    }
  }

  const priorityColors: Record<string, string> = {
    critical: 'var(--app-priority-critical)',
    high: 'var(--app-priority-high)',
    medium: 'var(--app-priority-medium)',
    low: 'var(--app-priority-low)',
  };

  return (
    <div
      className='flex flex-wrap items-center gap-4 px-5 py-4'
      style={{ borderBottom: '1px solid var(--app-border)' }}
    >
      {/* Priority badge */}
      <div className='w-24'>
        <span
          className='inline-block rounded-lg px-2.5 py-1 text-xs font-bold capitalize'
          style={{
            background: `color-mix(in srgb, ${priorityColors[rule.priority] ?? 'var(--app-accent)'} 15%, transparent)`,
            color: priorityColors[rule.priority] ?? 'var(--app-accent)',
          }}
        >
          {rule.priority}
        </span>
      </div>

      {/* Fields */}
      <div className='flex flex-1 flex-wrap items-center gap-3'>
        <div>
          <label
            className='block text-[10px] font-bold uppercase tracking-wider mb-1'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Response (hrs)
          </label>
          <input
            type='number'
            min='0'
            step='0.5'
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className='w-20 rounded-lg px-2 py-1.5 text-sm outline-none'
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text-primary)',
            }}
          />
        </div>
        <div>
          <label
            className='block text-[10px] font-bold uppercase tracking-wider mb-1'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Resolution (hrs)
          </label>
          <input
            type='number'
            min='0'
            step='0.5'
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className='w-20 rounded-lg px-2 py-1.5 text-sm outline-none'
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text-primary)',
            }}
          />
        </div>
        <div>
          <label
            className='block text-[10px] font-bold uppercase tracking-wider mb-1'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Escalation (hrs)
          </label>
          <input
            type='number'
            min='0'
            step='0.5'
            value={escalation}
            onChange={(e) => setEscalation(e.target.value)}
            placeholder='—'
            className='w-20 rounded-lg px-2 py-1.5 text-sm outline-none'
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text-primary)',
            }}
          />
        </div>
        <div>
          <label
            className='block text-[10px] font-bold uppercase tracking-wider mb-1'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Active
          </label>
          <button
            type='button'
            aria-label={`Toggle active: ${active ? 'on' : 'off'}`}
            onClick={() => setActive(!active)}
            className='relative h-6 w-11 shrink-0 rounded-full transition-all duration-200'
            style={{
              background: active
                ? 'var(--app-accent)'
                : 'var(--app-surface-raised)',
            }}
          >
            <span
              className='absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200'
              style={{ left: active ? '22px' : '2px' }}
            />
          </button>
        </div>
      </div>

      {/* Save */}
      {dirty && (
        <button
          type='button'
          onClick={handleSave}
          disabled={saving}
          className='flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-40'
          style={{
            background: 'var(--app-accent)',
            color: 'var(--primary-foreground)',
          }}
        >
          {saving ? (
            <Loader2 size={12} className='animate-spin' />
          ) : (
            <Save size={12} />
          )}
          Save
        </button>
      )}
    </div>
  );
}

export default function SLASettingsPage() {
  const { rules, loading, error, updateRule } = useSLARules();

  return (
    <div className='min-h-screen p-8' style={{ background: 'var(--app-bg)' }}>
      <div className='mx-auto max-w-3xl space-y-6'>
        <Link
          href='/settings'
          className='inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-all hover:bg-(--app-surface-raised)'
          style={{
            border: '1px solid var(--app-border)',
            color: 'var(--app-nav-idle-text)',
          }}
        >
          <ArrowLeft size={13} /> Back to Settings
        </Link>

        <div
          className='animate-fade-in-up opacity-0'
          style={{ animationFillMode: 'forwards' }}
        >
          <p
            className='mb-1 text-xs font-bold uppercase tracking-widest'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Settings
          </p>
          <h1
            className='flex items-center gap-3 text-xl font-bold tracking-tight'
            style={{ color: 'var(--app-text-primary)' }}
          >
            <Shield size={32} />
            SLA Management
          </h1>
          <p
            className='mt-1 text-sm'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Configure response and resolution targets per priority level.
          </p>
        </div>

        <Panel>
          <div
            className='px-5 py-4'
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <div className='flex items-center gap-2'>
              <Clock size={14} style={{ color: 'var(--app-accent)' }} />
              <p
                className='text-sm font-bold'
                style={{ color: 'var(--app-text-primary)' }}
              >
                SLA Rules
              </p>
            </div>
            <p
              className='mt-0.5 text-xs'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Each rule applies to tickets matching that priority. Times are in
              hours.
            </p>
          </div>

          {loading && (
            <div
              className='flex items-center gap-2 px-5 py-8'
              style={{ color: 'var(--app-text-faint)' }}
            >
              <Loader2 size={16} className='animate-spin' />
              <span className='text-sm'>Loading SLA rules…</span>
            </div>
          )}

          {error && (
            <div
              className='mx-5 my-3 rounded-md px-4 py-3 text-sm'
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

          {!loading &&
            !error &&
            rules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} onSave={updateRule} />
            ))}

          {!loading && !error && rules.length === 0 && (
            <div
              className='px-5 py-8 text-center text-sm'
              style={{ color: 'var(--app-text-faint)' }}
            >
              No SLA rules found. Run the SLA migration to create default rules.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/** biome-ignore-all lint/a11y/noLabelWithoutControl: labels are associated with adjacent inputs */
'use client';

import {
  ArrowLeft,
  Loader2,
  Play,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  type AutomationAction,
  type AutomationTrigger,
  useAutomations,
} from '@/hooks/useAutomations';

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  ticket_created: 'Ticket Created',
  ticket_updated: 'Ticket Updated',
  status_changed: 'Status Changed',
  priority_changed: 'Priority Changed',
  sla_breached: 'SLA Breached',
  ticket_idle: 'Ticket Idle',
};

const ACTION_LABELS: Record<AutomationAction, string> = {
  assign_to: 'Assign To',
  change_status: 'Change Status',
  change_priority: 'Change Priority',
  add_tag: 'Add Tag',
  send_notification: 'Send Notification',
  add_comment: 'Add Comment',
};

export default function AutomationsPage() {
  const { rules, log, loading, createRule, deleteRule, toggleRule } =
    useAutomations();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<AutomationTrigger>('ticket_created');
  const [action, setAction] = useState<AutomationAction>('send_notification');
  const [conditionsJson, setConditionsJson] = useState('{}');
  const [actionParamsJson, setActionParamsJson] = useState('{}');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    let conditions = {};
    let action_params = {};
    try {
      conditions = JSON.parse(conditionsJson);
    } catch {
      /* keep empty */
    }
    try {
      action_params = JSON.parse(actionParamsJson);
    } catch {
      /* keep empty */
    }
    try {
      await createRule({
        name: name.trim(),
        description: description.trim() || null,
        trigger,
        conditions,
        action,
        action_params,
      });
      setShowForm(false);
      setName('');
      setDescription('');
      setConditionsJson('{}');
      setActionParamsJson('{}');
    } catch (err) {
      console.error('Failed to create rule:', err);
    } finally {
      setSaving(false);
    }
  }

  const selectStyle: React.CSSProperties = {
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

  return (
    <div className='min-h-screen' style={{ background: 'var(--app-bg)' }}>
      <div className='space-y-6 p-8'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link
              href='/settings'
              className='flex h-9 w-9 items-center justify-center rounded-md transition-all hover:-translate-y-0.5'
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-secondary)',
              }}
            >
              <ArrowLeft size={15} />
            </Link>
            <div className='flex items-center gap-3'>
              <div
                className='flex h-10 w-10 items-center justify-center rounded-md'
                style={{
                  background: 'var(--app-accent-dim)',
                  border: '1px solid var(--app-accent-border)',
                }}
              >
                <Zap size={18} style={{ color: 'var(--app-accent-text)' }} />
              </div>
              <div>
                <h1
                  className='text-2xl font-bold tracking-tight'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  Automations
                </h1>
                <p
                  className='text-xs'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Auto-assign, escalate, and notify on ticket events
                </p>
              </div>
            </div>
          </div>
          <button
            type='button'
            onClick={() => setShowForm(!showForm)}
            className='flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90'
            style={{ background: 'var(--app-accent)', color: '#fff' }}
          >
            <Plus size={14} /> New Rule
          </button>
        </div>

        {/* New Rule Form */}
        {showForm && (
          <div className='glass-card overflow-hidden'>
            <div className='card-accent-line' />
            <div className='space-y-4 p-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label
                    className='mb-1 block text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Rule Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g. Auto-assign VPN tickets'
                    style={selectStyle}
                  />
                </div>
                <div>
                  <label
                    className='mb-1 block text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Description
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Optional description'
                    style={selectStyle}
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label
                    className='mb-1 block text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Trigger
                  </label>
                  <select
                    value={trigger}
                    onChange={(e) =>
                      setTrigger(e.target.value as AutomationTrigger)
                    }
                    style={selectStyle}
                  >
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className='mb-1 block text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Action
                  </label>
                  <select
                    value={action}
                    onChange={(e) =>
                      setAction(e.target.value as AutomationAction)
                    }
                    style={selectStyle}
                  >
                    {Object.entries(ACTION_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label
                    className='mb-1 block text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Conditions (JSON)
                  </label>
                  <input
                    value={conditionsJson}
                    onChange={(e) => setConditionsJson(e.target.value)}
                    placeholder='{"priority": "critical"}'
                    style={selectStyle}
                  />
                </div>
                <div>
                  <label
                    className='mb-1 block text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Action Params (JSON)
                  </label>
                  <input
                    value={actionParamsJson}
                    onChange={(e) => setActionParamsJson(e.target.value)}
                    placeholder='{"new_status": "closed"}'
                    style={selectStyle}
                  />
                </div>
              </div>
              <div className='flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => setShowForm(false)}
                  className='rounded-md px-4 py-2 text-sm font-semibold'
                  style={{
                    color: 'var(--app-text-muted)',
                    border: '1px solid var(--app-border)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleCreate}
                  disabled={saving || !name.trim()}
                  className='flex items-center gap-2 rounded-md px-5 py-2 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50'
                  style={{ background: 'var(--app-accent)', color: '#fff' }}
                >
                  {saving && <Loader2 size={13} className='animate-spin' />}
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rules List */}
        {loading ? (
          <div className='flex justify-center py-16'>
            <Loader2
              size={20}
              className='animate-spin'
              style={{ color: 'var(--app-text-faint)' }}
            />
          </div>
        ) : rules.length === 0 ? (
          <div
            className='flex flex-col items-center gap-3 py-16'
            style={{ color: 'var(--app-text-faint)' }}
          >
            <Zap size={28} />
            <p className='text-sm'>No automation rules yet</p>
          </div>
        ) : (
          <div className='glass-card overflow-hidden'>
            <div className='card-accent-line' />
            {rules.map((rule, i) => (
              <div
                key={rule.id}
                className='flex items-center gap-4 px-6 py-4'
                style={{
                  borderBottom:
                    i < rules.length - 1
                      ? '1px solid var(--app-border)'
                      : 'none',
                  opacity: rule.is_active ? 1 : 0.5,
                }}
              >
                <div
                  className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md'
                  style={{
                    background: rule.is_active
                      ? 'var(--app-accent-dim)'
                      : 'var(--app-surface-raised)',
                    border: `1px solid ${rule.is_active ? 'var(--app-accent-border)' : 'var(--app-border)'}`,
                  }}
                >
                  <Zap
                    size={14}
                    style={{
                      color: rule.is_active
                        ? 'var(--app-accent-text)'
                        : 'var(--app-text-faint)',
                    }}
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <p
                    className='text-sm font-bold'
                    style={{ color: 'var(--app-text-primary)' }}
                  >
                    {rule.name}
                  </p>
                  <p
                    className='text-xs'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    {TRIGGER_LABELS[rule.trigger]} →{' '}
                    {ACTION_LABELS[rule.action]}
                    {rule.description && ` · ${rule.description}`}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => toggleRule(rule.id, !rule.is_active)}
                    className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--app-surface-raised)]'
                    style={{ color: 'var(--app-text-muted)' }}
                    title={rule.is_active ? 'Disable' : 'Enable'}
                    aria-label={
                      rule.is_active
                        ? `Disable rule ${rule.name}`
                        : `Enable rule ${rule.name}`
                    }
                  >
                    {rule.is_active ? (
                      <Power size={14} />
                    ) : (
                      <PowerOff size={14} />
                    )}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      if (window.confirm('Delete this automation rule?'))
                        deleteRule(rule.id);
                    }}
                    className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--app-surface-raised)]'
                    style={{ color: 'var(--app-priority-critical)' }}
                    title='Delete'
                    aria-label={`Delete rule ${rule.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Execution Log */}
        {log.length > 0 && (
          <div className='glass-card overflow-hidden'>
            <div className='card-accent-line' />
            <div
              className='px-6 py-3'
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <div className='flex items-center gap-2'>
                <Play size={13} style={{ color: 'var(--app-accent-text)' }} />
                <span
                  className='text-xs font-bold uppercase tracking-wider'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Recent Executions
                </span>
              </div>
            </div>
            {log.slice(0, 10).map((entry, i) => (
              <div
                key={entry.id}
                className='flex items-center gap-4 px-6 py-3'
                style={{
                  borderBottom:
                    i < Math.min(log.length, 10) - 1
                      ? '1px solid var(--app-border)'
                      : 'none',
                }}
              >
                <span
                  className='h-2 w-2 rounded-full'
                  style={{
                    background:
                      entry.result === 'success'
                        ? 'var(--app-health-healthy)'
                        : 'var(--app-priority-critical)',
                  }}
                />
                <span
                  className='text-xs'
                  style={{ color: 'var(--app-text-secondary)' }}
                >
                  {rules.find((r) => r.id === entry.rule_id)?.name ??
                    entry.rule_id.slice(0, 8)}
                </span>
                <span
                  className='ml-auto text-[10px]'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  {new Date(entry.executed_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

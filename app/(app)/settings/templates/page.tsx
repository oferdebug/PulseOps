/** biome-ignore-all lint/a11y/noLabelWithoutControl: labels are visually associated in this form layout */
'use client';

import {
  ArrowLeft,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Panel } from '@/components/ui/panel';
import type { TicketTemplate } from '@/hooks/useTemplates';
import { useTemplates } from '@/hooks/useTemplates';

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

function TemplateForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TicketTemplate;
  onSave: (
    data: Omit<TicketTemplate, 'id' | 'created_at' | 'updated_at'>,
  ) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'general');
  const [priority, setPriority] = useState(
    initial?.default_priority ?? 'medium',
  );
  const [titleTpl, setTitleTpl] = useState(initial?.title_template ?? '');
  const [bodyTpl, setBodyTpl] = useState(initial?.body_template ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      category,
      default_priority: priority,
      title_template: titleTpl,
      body_template: bodyTpl,
      is_active: initial?.is_active ?? true,
      created_by: initial ? undefined : null,
    } as Omit<TicketTemplate, 'id' | 'created_at' | 'updated_at'>);
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4 p-5'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <label style={labelStyle}>Template Name *</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. VPN Issue'
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='w-full rounded-md px-3 py-2 text-sm outline-none'
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text-primary)',
              height: '40px',
            }}
          >
            <option value='general'>General</option>
            <option value='networking'>Networking</option>
            <option value='hardware'>Hardware</option>
            <option value='software'>Software</option>
            <option value='access'>Access</option>
            <option value='security'>Security</option>
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <input
          style={inputStyle}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Brief description of when to use this template'
        />
      </div>
      <div>
        <label style={labelStyle}>Default Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className='w-48 rounded-md px-3 py-2 text-sm outline-none'
          style={{
            background: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text-primary)',
            height: '40px',
          }}
        >
          <option value='low'>Low</option>
          <option value='medium'>Medium</option>
          <option value='high'>High</option>
          <option value='critical'>Critical</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Title Template</label>
        <input
          style={inputStyle}
          value={titleTpl}
          onChange={(e) => setTitleTpl(e.target.value)}
          placeholder='e.g. VPN: [Brief description]'
        />
      </div>
      <div>
        <label style={labelStyle}>Body Template</label>
        <textarea
          style={{
            ...inputStyle,
            height: 'auto',
            minHeight: '160px',
            padding: '12px',
            resize: 'vertical',
            fontFamily: 'monospace',
          }}
          value={bodyTpl}
          onChange={(e) => setBodyTpl(e.target.value)}
          placeholder='Markdown template body…'
        />
      </div>
      <div className='flex gap-2 pt-2'>
        <button
          type='submit'
          disabled={!name.trim()}
          className='flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
          style={{
            background: 'var(--app-accent)',
            color: 'var(--primary-foreground)',
          }}
        >
          <Save size={14} />
          {initial ? 'Update' : 'Create'}
        </button>
        <button
          type='button'
          onClick={onCancel}
          className='flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-(--app-surface-raised)'
          style={{
            border: '1px solid var(--app-border)',
            color: 'var(--app-nav-idle-text)',
          }}
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function TemplatesSettingsPage() {
  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplates();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingTemplate = editingId
    ? templates.find((t) => t.id === editingId)
    : undefined;

  return (
    <div
      className='min-h-screen p-8'
      style={{ background: 'var(--app-bg)' }}
    >
      <div
        className='mx-auto max-w-3xl space-y-6'
        
      >
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
          className='animate-fade-in-up opacity-0 flex items-end justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <p
              className='mb-1 text-xs font-bold uppercase tracking-widest'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Settings
            </p>
            <h1 className='flex items-center gap-3 text-xl font-bold tracking-tight' style={{ color: 'var(--app-text-primary)' }}>
              <FileText size={32} />
              Ticket Templates
            </h1>
            <p
              className='mt-1 text-sm'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Create reusable templates for common ticket types.
            </p>
          </div>
          {!showForm && !editingId && (
            <button
              type='button'
              onClick={() => setShowForm(true)}
              className='flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:opacity-90'
              style={{
                background: 'var(--app-accent)',
                color: 'var(--primary-foreground)',
              }}
            >
              <Plus size={14} /> New Template
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <Panel>
            <div
              className='px-5 py-3'
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <p
                className='text-sm font-bold'
                style={{ color: 'var(--app-text-primary)' }}
              >
                New Template
              </p>
            </div>
            <TemplateForm
              onSave={async (data) => {
                await createTemplate(data);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </Panel>
        )}

        {/* Edit form */}
        {editingId && editingTemplate && (
          <Panel>
            <div
              className='px-5 py-3'
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <p
                className='text-sm font-bold'
                style={{ color: 'var(--app-text-primary)' }}
              >
                Edit Template
              </p>
            </div>
            <TemplateForm
              initial={editingTemplate}
              onSave={async (data) => {
                await updateTemplate(editingId, data);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          </Panel>
        )}

        {/* Templates list */}
        <Panel>
          <div
            className='px-5 py-4'
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              All Templates
            </p>
            <p
              className='mt-0.5 text-xs'
              style={{ color: 'var(--app-text-muted)' }}
            >
              {loading
                ? 'Loading…'
                : `${templates.length} template${templates.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {loading && (
            <div
              className='flex items-center gap-2 px-5 py-8'
              style={{ color: 'var(--app-text-faint)' }}
            >
              <Loader2 size={16} className='animate-spin' />
              <span className='text-sm'>Loading templates…</span>
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

          {!loading && !error && templates.length === 0 && (
            <div
              className='flex flex-col items-center gap-3 py-16'
              style={{ color: 'var(--app-text-faint)' }}
            >
              <FileText size={36} />
              <p className='text-sm font-medium'>No templates yet</p>
            </div>
          )}

          {!loading &&
            !error &&
            templates.map((t) => (
              <div
                key={t.id}
                className='flex items-center gap-4 px-5 py-3.5'
                style={{ borderBottom: '1px solid var(--app-border)' }}
              >
                <FileText
                  size={16}
                  className='shrink-0'
                  style={{ color: 'var(--app-accent)' }}
                />
                <div className='flex-1'>
                  <p
                    className='text-sm font-bold'
                    style={{ color: 'var(--app-text-primary)' }}
                  >
                    {t.name}
                  </p>
                  <p
                    className='text-xs'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    {t.category} · {t.default_priority} priority
                  </p>
                </div>
                <div className='flex gap-1'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(t.id);
                    }}
                    className='rounded-lg p-1.5 transition-colors hover:bg-(--app-surface-raised)'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      if (window.confirm(`Delete template "${t.name}"?`))
                        deleteTemplate(t.id);
                    }}
                    className='rounded-lg p-1.5 transition-colors hover:bg-(--app-surface-raised)'
                    style={{ color: 'var(--destructive)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
        </Panel>
      </div>
    </div>
  );
}

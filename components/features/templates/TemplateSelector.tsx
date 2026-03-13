'use client';

import { FileText, Loader2 } from 'lucide-react';
import type { TicketTemplate } from '@/hooks/useTemplates';
import { useTemplates } from '@/hooks/useTemplates';

interface TemplateSelectorProps {
  onSelect: (template: TicketTemplate) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  networking: 'Networking',
  hardware: 'Hardware',
  software: 'Software',
  access: 'Access',
  security: 'Security',
};

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const { templates, loading } = useTemplates();

  if (loading) {
    return (
      <div
        className='flex items-center gap-2 py-4'
        style={{ color: 'var(--app-text-faint)' }}
      >
        <Loader2 size={14} className='animate-spin' />
        <span className='text-xs'>Loading templates…</span>
      </div>
    );
  }

  if (templates.length === 0) return null;

  // Group by category
  const grouped = templates.reduce<Record<string, TicketTemplate[]>>(
    (acc, t) => {
      const cat = t.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    },
    {},
  );

  return (
    <div className='space-y-3'>
      <p
        className='text-[11px] font-bold uppercase tracking-widest'
        style={{ color: 'var(--app-text-muted)' }}
      >
        Or start from a template
      </p>
      <div className='grid gap-2 sm:grid-cols-2'>
        {Object.entries(grouped).map(([category, tmps]) => (
          <div key={category}>
            <p
              className='mb-1.5 text-[10px] font-bold uppercase tracking-wider'
              style={{ color: 'var(--app-text-faint)' }}
            >
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <div className='space-y-1'>
              {tmps.map((t) => (
                <button
                  key={t.id}
                  type='button'
                  onClick={() => onSelect(t)}
                  className='flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left transition-all hover:bg-(--app-surface-raised)'
                  style={{
                    border: '1px solid var(--app-border)',
                    background: 'var(--app-surface)',
                  }}
                >
                  <FileText
                    size={14}
                    className='mt-0.5 shrink-0'
                    style={{ color: 'var(--app-accent)' }}
                  />
                  <div>
                    <p
                      className='text-xs font-bold'
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      {t.name}
                    </p>
                    {t.description && (
                      <p
                        className='mt-0.5 text-[11px]'
                        style={{ color: 'var(--app-text-muted)' }}
                      >
                        {t.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

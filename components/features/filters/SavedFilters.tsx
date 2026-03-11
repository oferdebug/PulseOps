'use client';

import { Bookmark, Check, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useSavedFilters } from '@/hooks/useSavedFilters';

interface SavedFiltersProps {
  entityType: string;
  userId: string | undefined;
  currentFilters: Record<string, unknown>;
  onApply: (filters: Record<string, unknown>) => void;
}

export function SavedFilters({
  entityType,
  userId,
  currentFilters,
  onApply,
}: SavedFiltersProps) {
  const { filters, loading, saveFilter, deleteFilter } = useSavedFilters(
    entityType,
    userId,
  );
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    await saveFilter(name.trim(), currentFilters);
    setName('');
    setShowSave(false);
    setSaving(false);
  }, [name, saveFilter, currentFilters]);

  if (!userId) return null;

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {/* Saved preset chips */}
      {filters.map((f) => (
        <div
          key={f.id}
          className='group flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors hover:bg-[var(--app-surface-raised)]'
          style={{
            background: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text-secondary)',
          }}
        >
          <button
            type='button'
            className='flex items-center gap-1'
            onClick={() => onApply(f.filters as Record<string, unknown>)}
          >
            <Bookmark size={11} />
            {f.name}
          </button>
          <button
            type='button'
            onClick={() => deleteFilter(f.id)}
            className='ml-1 hidden group-hover:flex items-center'
            style={{ color: 'var(--destructive)' }}
            aria-label={`Delete filter ${f.name}`}
          >
            <Trash2 size={10} />
          </button>
        </div>
      ))}

      {/* Save current filter */}
      {showSave ? (
        <div className='flex items-center gap-1'>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder='Filter name…'
            className='rounded-lg px-2 py-1 text-xs outline-none'
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text-primary)',
              width: '120px',
            }}
          />
          <button
            type='button'
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className='flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--app-surface-raised)]'
            style={{ color: 'var(--app-health-healthy)' }}
            aria-label='Confirm save filter'
          >
            {saving ? (
              <Loader2 size={12} className='animate-spin' />
            ) : (
              <Check size={12} />
            )}
          </button>
          <button
            type='button'
            onClick={() => {
              setShowSave(false);
              setName('');
            }}
            className='flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--app-surface-raised)]'
            style={{ color: 'var(--app-text-muted)' }}
            aria-label='Cancel save filter'
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => setShowSave(true)}
          className='flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-[var(--app-surface-raised)]'
          style={{
            border: '1px dashed var(--app-border)',
            color: 'var(--app-text-muted)',
          }}
        >
          <Plus size={10} />
          Save filter
        </button>
      )}

      {loading && (
        <Loader2
          size={12}
          className='animate-spin'
          style={{ color: 'var(--app-text-faint)' }}
        />
      )}
    </div>
  );
}

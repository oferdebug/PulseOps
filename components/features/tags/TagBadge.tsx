'use client';

import { X } from 'lucide-react';
import type { Tag } from '@/hooks/useTags';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: (tagId: string) => void;
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return (
    <span
      className='inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium'
      style={{
        backgroundColor: tag.color ? `${tag.color}20` : 'var(--muted)',
        color: tag.color ?? 'var(--muted-foreground)',
        border: `1px solid ${tag.color ?? 'var(--border)'}`,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          type='button'
          onClick={() => onRemove(tag.id)}
          className='ml-0.5 rounded-sm hover:opacity-70'
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className='h-3 w-3' />
        </button>
      )}
    </span>
  );
}

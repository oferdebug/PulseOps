'use client';

import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { type Tag, useTags } from '@/hooks/useTags';
import { TagBadge } from './TagBadge';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
];

interface TagInputProps {
  entityType: 'ticket' | 'article';
  entityId: string;
  onTagsChange?: (tags: Tag[]) => void;
}

export function TagInput({ entityType, entityId }: TagInputProps) {
  const { tags, loading, error, addTag, removeTag } = useTags({
    entityId,
    entityType,
  });
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await addTag(trimmed, color);
      setName('');
      setColor(PRESET_COLORS[0]);
      setOpen(false);
    } catch {
      /* keep popover open so the user can retry */
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className={'space-y-2'}>
      <div className={'flex flex-wrap gap-2'}>
        {tags.map((tag: Tag) => (
          <TagBadge key={tag.id} tag={tag} onRemove={removeTag} />
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              size={'sm'}
              className={'h-6 gap-1 px-2 text-xs'}
              disabled={loading}
            >
              <Plus className='h-3 w-3' />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className={'w-64 space-y-3 p-3'} align={'start'}>
            <Input
              ref={inputRef}
              placeholder='Tag Name...'
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={'h-8 text-sm'}
              autoFocus
            />

            <div className='flex flex-wrap gap-1.5'>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type='button'
                  className='h-5 w-5 rounded-full border-2 transition-transform hover:scale-110'
                  style={{
                    backgroundColor: c,
                    borderColor:
                      c === color ? 'var(--foreground)' : 'transparent',
                  }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>

            <Button
              size='sm'
              className='w-full'
              onClick={handleAdd}
              disabled={!name.trim()}
            >
              Add
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  );
}

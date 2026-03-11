'use client';

import { Lock, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CommentType } from '@/lib/types/features';

interface CommentInputProps {
  onSubmit: (formData: {
    content: string;
    comment_type: CommentType;
    parent_id?: string;
  }) => Promise<unknown>;
  canAddInternal?: boolean;
  parentId?: string;
  placeholder?: string;
}

export function CommentInput({
  onSubmit,
  canAddInternal = false,
  parentId,
  placeholder = 'Write a comment...',
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    await onSubmit({
      content: trimmed,
      comment_type: isInternal ? 'internal' : 'public',
      parent_id: parentId,
    });
    setContent('');
    setSubmitting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className='space-y-2'>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className='min-h-[80px] text-sm'
        disabled={submitting}
      />

      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {canAddInternal && (
            <Button
              type='button'
              variant={isInternal ? 'secondary' : 'ghost'}
              size='sm'
              className='h-7 gap-1 text-xs'
              onClick={() => setIsInternal(!isInternal)}
            >
              <Lock className='h-3 w-3' />
              {isInternal ? 'Internal note' : 'Public'}
            </Button>
          )}
          <span className='text-xs text-muted-foreground'>
            Ctrl+Enter to send
          </span>
        </div>

        <Button
          size='sm'
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className='gap-1'
        >
          <Send className='h-3.5 w-3.5' />
          {submitting ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}

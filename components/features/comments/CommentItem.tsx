'use client';

import { Edit2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import type { TicketComment } from '@/lib/types/features';

interface CommentItemProps {
  comment: TicketComment;
  currentUserId?: string;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export function CommentItem({
  comment,
  currentUserId,
  onUpdate,
  onDelete,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const isOwn = currentUserId === comment.created_by;
  const authorName =
    comment.author?.full_name ?? comment.author?.email ?? 'Unknown';
  const initials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleSave() {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(comment.id, trimmed);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(comment.content);
    }
  }

  return (
    <div className='flex gap-3'>
      <Avatar size='sm'>
        <AvatarFallback className='text-[10px]'>{initials}</AvatarFallback>
      </Avatar>

      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>{authorName}</span>
          <span className='text-xs text-muted-foreground'>
            {new Date(comment.created_at).toLocaleString()}
          </span>
          {comment.is_edited && (
            <span className='text-xs text-muted-foreground italic'>
              (edited)
            </span>
          )}
          {comment.comment_type === 'internal' && (
            <span className='rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-600'>
              Internal
            </span>
          )}
        </div>

        {isEditing ? (
          <div className='mt-1 space-y-2'>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className='min-h-[60px] text-sm'
              autoFocus
            />
            <div className='flex gap-2'>
              <Button size='sm' onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className='mt-1 text-sm whitespace-pre-wrap'>{comment.content}</p>
        )}
      </div>

      {isOwn && !isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 w-7 p-0'
              aria-label='Comment actions'
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit2 className='mr-2 h-3.5 w-3.5' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className='text-destructive'
              onClick={async () => {
                if (window.confirm('Delete this comment?')) {
                  try {
                    await onDelete(comment.id);
                  } catch {
                    // Error handling delegated to parent or hook
                  }
                }
              }}
            >
              <Trash2 className='mr-2 h-3.5 w-3.5' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

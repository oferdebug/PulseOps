'use client';

import { Loader2, MessageSquare } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';

interface CommentSectionProps {
  ticketId: string;
  canAddInternal?: boolean;
}

export function CommentSection({
  ticketId,
  canAddInternal = false,
}: CommentSectionProps) {
  const { comments, loading, error, addComment, updateComment, deleteComment } =
    useComments(ticketId);
  const { user } = useCurrentUser();

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <MessageSquare className='h-4 w-4' />
        <h3 className='text-sm font-semibold'>Comments ({comments.length})</h3>
      </div>

      {/* Comment input */}
      <CommentInput onSubmit={addComment} canAddInternal={canAddInternal} />

      {/* Loading */}
      {loading && (
        <div className='flex items-center justify-center py-6'>
          <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {error}
        </p>
      )}

      {/* Comments list */}
      {!loading && comments.length === 0 && (
        <p className='py-6 text-center text-sm text-muted-foreground'>
          No comments yet. Be the first to comment.
        </p>
      )}

      <div className='space-y-4'>
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={user?.id}
            onUpdate={updateComment}
            onDelete={deleteComment}
          />
        ))}
      </div>
    </div>
  );
}

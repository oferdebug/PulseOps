'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CommentFormData, TicketComment } from '@/lib/types/features';

const COMMENT_SELECT = `*,author:created_by(id,full_name,email)`;

export function useComments(ticketId: string) {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('ticket_comments')
        .select(COMMENT_SELECT)
        .eq('ticket_id', ticketId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setComments((data ?? []) as TicketComment[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [supabase, ticketId]);

  const addComment = useCallback(
    async (formData: CommentFormData) => {
      setError(null);
      try {
        const { data, error: insertError } = await supabase
          .from('ticket_comments')
          .insert({
            ticket_id: ticketId,
            content: formData.content,
            comment_type: formData.comment_type,
            mentions: formData.mentions ?? [],
            parent_id: formData.parent_id ?? null,
          })
          .select(COMMENT_SELECT)
          .single();

        if (insertError) throw insertError;

        const comment = data as TicketComment;

        if (!comment.parent_id) {
          setComments((prev) => [...prev, comment]);
        }

        return comment;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add comment');
        return null;
      }
    },
    [supabase, ticketId],
  );

  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      setError(null);
      try {
        const { data, error: updateError } = await supabase
          .from('ticket_comments')
          .update({
            content,
            is_edited: true,
            edited_at: new Date().toISOString(),
          })
          .eq('id', commentId)
          .select(COMMENT_SELECT)
          .single();

        if (updateError) throw updateError;

        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? (data as TicketComment) : c)),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update comment',
        );
      }
    },
    [supabase],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      setError(null);
      try {
        const { error: deleteError } = await supabase
          .from('ticket_comments')
          .delete()
          .eq('id', commentId);

        if (deleteError) throw deleteError;

        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete comment',
        );
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (ticketId) {
      fetchComments();
    }
  }, [ticketId, fetchComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refresh: fetchComments,
  };
}

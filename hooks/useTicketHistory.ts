'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface TicketHistoryEntry {
  id: string;
  ticket_id: string;
  changed_by: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
  profile?: { full_name: string | null; email: string | null } | null;
}

export function useTicketHistory(ticketId: string) {
  const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('ticket_history')
        .select('*, profile:changed_by(full_name, email)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setHistory((data ?? []) as TicketHistoryEntry[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load ticket history',
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) fetchHistory();
  }, [ticketId, fetchHistory]);

  return { history, loading, error, refresh: fetchHistory };
}

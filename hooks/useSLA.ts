'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface SLARule {
  id: string;
  name: string;
  priority: string;
  first_response_hours: number;
  resolution_hours: number;
  escalation_hours: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketSLA {
  id: string;
  ticket_id: string;
  sla_rule_id: string | null;
  first_response_due: string | null;
  resolution_due: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  first_response_breached: boolean;
  resolution_breached: boolean;
  created_at: string;
}

export type SLAStatus = 'ok' | 'warning' | 'breached' | 'met';

export function getSLAStatus(
  due: string | null,
  completedAt: string | null,
  breached: boolean,
): SLAStatus {
  if (completedAt) return breached ? 'breached' : 'met';
  if (!due) return 'ok';
  const now = new Date();
  const dueDate = new Date(due);
  if (now > dueDate) return 'breached';
  const hoursLeft = (dueDate.getTime() - now.getTime()) / 3600000;
  if (hoursLeft < 2) return 'warning';
  return 'ok';
}

export function getTimeRemaining(due: string | null): string {
  if (!due) return '—';
  const now = new Date();
  const dueDate = new Date(due);
  const diff = dueDate.getTime() - now.getTime();

  if (diff <= 0) {
    const over = Math.abs(diff);
    const hours = Math.floor(over / 3600000);
    const mins = Math.floor((over % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d overdue`;
    if (hours > 0) return `${hours}h ${mins}m overdue`;
    return `${mins}m overdue`;
  }

  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export function useTicketSLA(ticketId: string) {
  const [sla, setSla] = useState<TicketSLA | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSLA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('ticket_sla')
        .select('*')
        .eq('ticket_id', ticketId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      setSla(data as TicketSLA | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SLA');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) fetchSLA();
  }, [ticketId, fetchSLA]);

  return { sla, loading, error, refresh: fetchSLA };
}

export function useSLARules() {
  const [rules, setRules] = useState<SLARule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('sla_rules')
        .select('*')
        .order('first_response_hours', { ascending: true });

      if (fetchError) throw fetchError;
      setRules((data ?? []) as SLARule[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SLA rules');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRule = useCallback(
    async (id: string, updates: Partial<SLARule>) => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('sla_rules')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (updateError) throw updateError;
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update SLA rule',
        );
      }
    },
    [],
  );

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { rules, loading, error, updateRule, refresh: fetchRules };
}

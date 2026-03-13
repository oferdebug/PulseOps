'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type AutomationTrigger =
  | 'ticket_created'
  | 'ticket_updated'
  | 'status_changed'
  | 'priority_changed'
  | 'sla_breached'
  | 'ticket_idle';

export type AutomationAction =
  | 'assign_to'
  | 'change_status'
  | 'change_priority'
  | 'add_tag'
  | 'send_notification'
  | 'add_comment';

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: AutomationTrigger;
  conditions: Record<string, unknown>;
  action: AutomationAction;
  action_params: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface AutomationLogEntry {
  id: string;
  rule_id: string;
  ticket_id: string | null;
  result: string;
  details: Record<string, unknown> | null;
  executed_at: string;
}

export function useAutomations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [log, setLog] = useState<AutomationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchErr } = await supabase
      .from('automation_rules')
      .select('*')
      .order('created_at', { ascending: false });
    if (fetchErr) {
      console.error('Failed to fetch automation rules:', fetchErr);
      setError(fetchErr);
    } else {
      setError(null);
      setRules((data ?? []) as AutomationRule[]);
    }
    setLoading(false);
  }, []);

  const fetchLog = useCallback(async (limit = 50) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('automation_log')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(limit);
    if (error) console.error('Failed to fetch automation log:', error);
    setLog((data ?? []) as AutomationLogEntry[]);
  }, []);

  const createRule = useCallback(
    async (rule: Omit<AutomationRule, 'id' | 'created_at' | 'is_active'>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('automation_rules')
        .insert(rule)
        .select()
        .single();
      if (!error && data) {
        setRules((prev) => [data as AutomationRule, ...prev]);
      }
      return { data, error };
    },
    [],
  );

  const updateRule = useCallback(
    async (id: string, updates: Partial<AutomationRule>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('automation_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error) {
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        );
      }
      return { data, error };
    },
    [],
  );

  const deleteRule = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);
    if (!error) {
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
    return error;
  }, []);

  const toggleRule = useCallback(
    async (id: string, active: boolean) => {
      return updateRule(id, { is_active: active });
    },
    [updateRule],
  );

  useEffect(() => {
    fetchRules();
    fetchLog();
  }, [fetchRules, fetchLog]);

  return {
    rules,
    log,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    refresh: fetchRules,
  };
}

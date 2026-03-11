'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AuditEntry {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity: string;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface AuditFilters {
  action?: string;
  entity?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEntries = useCallback(
    async (filters: AuditFilters = {}, page = 0, pageSize = 50) => {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters.action) query = query.eq('action', filters.action);
      if (filters.entity) query = query.eq('entity', filters.entity);
      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

      const { data, count } = await query;
      setEntries((data ?? []) as AuditEntry[]);
      setTotalCount(count ?? 0);
      setLoading(false);
    },
    [],
  );

  const exportAudit = useCallback(async (filters: AuditFilters = {}) => {
    const supabase = createClient();
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (filters.action) query = query.eq('action', filters.action);
    if (filters.entity) query = query.eq('entity', filters.entity);
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    const { data } = await query;
    if (!data || data.length === 0) return;

    const headers = [
      'Timestamp',
      'User Email',
      'Action',
      'Entity',
      'Entity ID',
      'Description',
      'Metadata',
    ];

    const rows = data.map((e) => [
      new Date(e.created_at).toISOString(),
      e.user_email,
      e.action,
      e.entity,
      e.entity_id ?? '',
      (e.description ?? '').replace(/"/g, '""'),
      JSON.stringify(e.metadata ?? {}),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulseops-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { entries, loading, totalCount, fetchEntries, exportAudit };
}

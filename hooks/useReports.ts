'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type TicketStatus = 'open' | 'in_progress' | 'pending' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface TicketRow {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportData {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  avgResolutionHours: number;
  statusBreakdown: Record<TicketStatus, number>;
  priorityBreakdown: Record<TicketPriority, number>;
  dailyCounts: { date: string; count: number }[];
  agentWorkload: { agent_id: string; name: string; count: number }[];
}

export function useReports(days = 30) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchReports = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: tickets, error: fetchError } = await supabase
        .from('tickets')
        .select('id, status, priority, assigned_to, created_at, updated_at')
        .gte('created_at', since.toISOString());

      if (fetchError) throw fetchError;
      const rows = (tickets ?? []) as TicketRow[];

      const statusBreakdown = {
        open: 0,
        in_progress: 0,
        pending: 0,
        closed: 0,
      };
      const priorityBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };
      const dailyMap = new Map<string, number>();
      const agentMap = new Map<string, number>();
      let totalResolutionMs = 0;
      let closedCount = 0;

      for (const t of rows) {
        statusBreakdown[t.status]++;
        priorityBreakdown[t.priority]++;

        const day = t.created_at.slice(0, 10);
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);

        if (t.assigned_to) {
          agentMap.set(t.assigned_to, (agentMap.get(t.assigned_to) ?? 0) + 1);
        }

        if (t.status === 'closed') {
          closedCount++;
          totalResolutionMs +=
            new Date(t.updated_at).getTime() - new Date(t.created_at).getTime();
        }
      }

      // Build daily array for the date range
      const dailyCounts: { date: string; count: number }[] = [];
      const cursor = new Date(since);
      while (cursor <= new Date()) {
        const key = cursor.toISOString().slice(0, 10);
        dailyCounts.push({ date: key, count: dailyMap.get(key) ?? 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      // Resolve agent names
      const agentIds = Array.from(agentMap.keys());
      let agentWorkload: { agent_id: string; name: string; count: number }[] =
        [];
      if (agentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', agentIds);

        agentWorkload = agentIds.map((id) => {
          const p = profiles?.find((pr) => pr.id === id);
          return {
            agent_id: id,
            name: p?.full_name?.trim() || p?.email || id.slice(0, 8),
            count: agentMap.get(id) ?? 0,
          };
        });
        agentWorkload.sort((a, b) => b.count - a.count);
      }

      if (requestId !== requestIdRef.current) return;
      setData({
        totalTickets: rows.length,
        openTickets:
          statusBreakdown.open +
          statusBreakdown.in_progress +
          statusBreakdown.pending,
        closedTickets: closedCount,
        avgResolutionHours:
          closedCount > 0
            ? Math.round((totalResolutionMs / closedCount / 3600000) * 10) / 10
            : 0,
        statusBreakdown,
        priorityBreakdown,
        dailyCounts,
        agentWorkload,
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, loading, error, refresh: fetchReports };
}

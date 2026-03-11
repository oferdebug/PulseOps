'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  entity_type: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useSavedFilters(entityType: string, userId?: string) {
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFilters = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false });
    setFilters((data ?? []) as SavedFilter[]);
    setLoading(false);
  }, [entityType, userId]);

  const saveFilter = useCallback(
    async (name: string, filterValues: Record<string, unknown>) => {
      if (!userId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: userId,
          name,
          entity_type: entityType,
          filters: filterValues,
        })
        .select()
        .single();
      if (!error && data) {
        setFilters((prev) => [data as SavedFilter, ...prev]);
        return data as SavedFilter;
      }
      return null;
    },
    [entityType, userId],
  );

  const deleteFilter = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', id);
    if (!error) setFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  return { filters, loading, saveFilter, deleteFilter, refresh: fetchFilters };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface TicketTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  default_priority: string;
  title_template: string;
  body_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('ticket_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (fetchError) throw fetchError;
      setTemplates((data ?? []) as TicketTemplate[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback(
    async (
      template: Omit<TicketTemplate, 'id' | 'created_at' | 'updated_at'>,
    ) => {
      try {
        const supabase = createClient();
        const { data, error: insertError } = await supabase
          .from('ticket_templates')
          .insert(template)
          .select()
          .single();

        if (insertError) throw insertError;
        setTemplates((prev) => [...prev, data as TicketTemplate]);
        return data as TicketTemplate;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create template',
        );
        return null;
      }
    },
    [],
  );

  const updateTemplate = useCallback(
    async (id: string, updates: Partial<TicketTemplate>) => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('ticket_templates')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (updateError) throw updateError;
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        );
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update template',
        );
        return false;
      }
    },
    [],
  );

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from('ticket_templates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete template',
      );
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refresh: fetchTemplates,
  };
}

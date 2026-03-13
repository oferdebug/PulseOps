'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface TicketResult {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export interface ArticleResult {
  id: string;
  title: string;
  category: string;
  status: string;
}

export interface SearchResults {
  tickets: TicketResult[];
  articles: ArticleResult[];
}

const EMPTY_RESULTS: SearchResults = {
  tickets: [],
  articles: [],
};

export function useSearch(query: string) {
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    // Avoid comma in pattern so .or() clause parsing doesn't break
    const safe = q.replace(/,/g, ' ').trim();
    const pattern = `%${safe}%`;

    const [ticketsRes, articlesRes] = await Promise.all([
      supabase
        .from('tickets')
        .select('id, title, status, priority, created_at')
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('articles')
        .select('id, title, category, status')
        .eq('status', 'published')
        .or(`title.ilike.${pattern},content.ilike.${pattern}`)
        .limit(8),
    ]);

    setResults({
      tickets: (ticketsRes.data ?? []) as TicketResult[],
      articles: (articlesRes.data ?? []) as ArticleResult[],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      runSearch(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return { results, loading };
}

'use client';

import { useCallback, useState } from 'react';

interface AiClassification {
  priority: string;
  category: string;
  suggested_response: string;
  tags: string[];
}

interface KbSuggestion {
  id: string;
  title: string;
  category: string;
}

export function useAiAssist() {
  const [classification, setClassification] = useState<AiClassification | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<KbSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const classify = useCallback(async (title: string, description?: string) => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.priority) setClassification(data);
    } catch {
      /* swallow – don't break analyzeTicket's Promise.all */
    } finally {
      setLoading(false);
    }
  }, []);

  const suggestArticles = useCallback(
    async (title: string, description?: string) => {
      if (!title.trim()) return;
      try {
        const res = await fetch('/api/ai-suggest-kb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        });
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const analyzeTicket = useCallback(
    async (title: string, description?: string) => {
      await Promise.all([
        classify(title, description),
        suggestArticles(title, description),
      ]);
    },
    [classify, suggestArticles],
  );

  return {
    classification,
    suggestions,
    loading,
    classify,
    suggestArticles,
    analyzeTicket,
    clearClassification: () => setClassification(null),
    clearSuggestions: () => setSuggestions([]),
  };
}

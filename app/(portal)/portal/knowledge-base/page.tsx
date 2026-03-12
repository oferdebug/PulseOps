'use client';

import { BookOpen, ChevronRight, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Article {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  networking: 'var(--app-stat-open)',
  security: 'var(--app-priority-critical)',
  hardware: 'var(--app-stat-resolution)',
  software: 'var(--app-stat-users)',
  email: 'var(--app-accent)',
  general: 'var(--app-stat-closed)',
  'active-directory': 'var(--app-priority-high)',
};

export default function PortalKnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchArticles = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('articles')
      .select('id, title, category, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    setArticles(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()),
  );

  // Group by category
  const categories = Array.from(new Set(filtered.map((a) => a.category)));

  return (
    <div className='space-y-6'>
      <div>
        <h1
          className='text-2xl font-bold tracking-tight'
          style={{ color: 'var(--app-text-primary)' }}
        >
          Knowledge Base
        </h1>
        <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
          Find answers to common questions
        </p>
      </div>

      {/* Search */}
      <div className='relative'>
        <Search
          size={14}
          className='absolute left-3 top-1/2 -translate-y-1/2'
          style={{ color: 'var(--app-text-faint)' }}
        />
        <input
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search articles...'
          className='h-10 w-full rounded-md pl-9 pr-4 text-sm'
          style={{
            background: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <div className='flex justify-center py-12'>
          <Loader2
            size={18}
            className='animate-spin'
            style={{ color: 'var(--app-text-faint)' }}
          />
        </div>
      ) : categories.length === 0 ? (
        <div
          className='flex flex-col items-center gap-3 py-12'
          style={{ color: 'var(--app-text-faint)' }}
        >
          <BookOpen size={28} />
          <p className='text-sm'>No articles found</p>
        </div>
      ) : (
        categories.map((cat) => (
          <div key={cat} className='glass-card overflow-hidden'>
            <div className='card-accent-line' />
            <div
              className='flex items-center gap-2 px-6 py-3'
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <span
                className='h-2.5 w-2.5 rounded-full'
                style={{
                  background: CATEGORY_COLOR[cat] ?? 'var(--app-text-muted)',
                }}
              />
              <span
                className='text-xs font-bold uppercase tracking-wider'
                style={{ color: 'var(--app-text-muted)' }}
              >
                {cat.replace(/-/g, ' ')}
              </span>
            </div>
            {filtered
              .filter((a) => a.category === cat)
              .map((article, i, arr) => (
                <Link
                  key={article.id}
                  href={`/knowledge-base/${article.id}`}
                  className='flex items-center justify-between px-6 py-3.5 transition-all hover:bg-[var(--app-surface-raised)]'
                  style={{
                    borderBottom:
                      i < arr.length - 1
                        ? '1px solid var(--app-border)'
                        : 'none',
                  }}
                >
                  <span
                    className='text-sm font-medium'
                    style={{ color: 'var(--app-text-secondary)' }}
                  >
                    {article.title}
                  </span>
                  <ChevronRight
                    size={13}
                    style={{ color: 'var(--app-text-faint)' }}
                  />
                </Link>
              ))}
          </div>
        ))
      )}
    </div>
  );
}

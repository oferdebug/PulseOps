'use client';

import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RelatedArticle {
  id: string;
  title: string;
  category: string;
}

interface RelatedArticlesProps {
  articleId: string;
  category: string;
}

export function RelatedArticles({ articleId, category }: RelatedArticlesProps) {
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();

      // Strategy 1: same tags via article_tags junction
      const { data: tagIds } = await supabase
        .from('article_tags')
        .select('tag_id')
        .eq('article_id', articleId);

      const tagMatches: RelatedArticle[] = [];
      if (tagIds && tagIds.length > 0) {
        const ids = tagIds.map((t) => t.tag_id);
        const { data } = await supabase
          .from('article_tags')
          .select('article_id, articles!inner(id, title, category)')
          .in('tag_id', ids)
          .neq('article_id', articleId)
          .limit(10);

        if (data) {
          const seen = new Set<string>();
          for (const row of data) {
            const a = row.articles as unknown as RelatedArticle;
            if (a && !seen.has(a.id)) {
              seen.add(a.id);
              tagMatches.push(a);
            }
          }
        }
      }

      // Strategy 2: same category fallback
      if (tagMatches.length < 3) {
        const { data: catMatches } = await supabase
          .from('articles')
          .select('id, title, category')
          .eq('category', category)
          .eq('status', 'published')
          .neq('id', articleId)
          .limit(5);

        const existingIds = new Set(tagMatches.map((a) => a.id));
        for (const a of catMatches ?? []) {
          if (!existingIds.has(a.id) && tagMatches.length < 5) {
            tagMatches.push(a);
          }
        }
      }

      setRelated(tagMatches.slice(0, 5));
      setLoading(false);
    }

    fetch();
  }, [articleId, category]);

  if (loading) {
    return (
      <div
        className='flex items-center gap-2 py-3'
        style={{ color: 'var(--app-text-faint)' }}
      >
        <Loader2 size={14} className='animate-spin' />
        <span className='text-xs'>Finding related articles…</span>
      </div>
    );
  }

  if (related.length === 0) {
    return (
      <p className='py-2 text-xs' style={{ color: 'var(--app-text-faint)' }}>
        No related articles found.
      </p>
    );
  }

  return (
    <div className='space-y-1.5'>
      {related.map((article) => (
        <Link
          key={article.id}
          href={`/knowledge-base/${article.id}`}
          className='flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all hover:bg-[var(--app-surface-raised)]'
          style={{
            border: '1px solid var(--app-border)',
            color: 'var(--app-text-primary)',
          }}
        >
          <BookOpen size={13} style={{ color: 'var(--app-accent)' }} />
          <span className='flex-1 truncate text-xs font-medium'>
            {article.title}
          </span>
          <span
            className='text-[10px] capitalize'
            style={{ color: 'var(--app-text-faint)' }}
          >
            {article.category}
          </span>
        </Link>
      ))}
    </div>
  );
}

/** biome-ignore-all assist/source/organizeImports: <explanation> */
'use client';
/**
 * Knowledge Base List Page — /knowledge-base
 *
 * Displays all articles with search and category filtering.
 * Shows published articles to everyone, drafts only to their author.
 *
 * TODO:
 * - Add pagination once article count grows.
 * - Move filtering to Supabase queries for better performance at scale.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, Search, BookOpen, RefreshCw } from 'lucide-react';

type ArticleStatus = 'draft' | 'published';
type ArticleCategory =
  | 'networking'
  | 'hardware'
  | 'software'
  | 'security'
  | 'active-directory'
  | 'email'
  | 'general';

interface ArticleRow {
  id: string;
  title: string;
  status: ArticleStatus;
  category: ArticleCategory;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  networking: 'Networking',
  hardware: 'Hardware',
  software: 'Software',
  security: 'Security',
  'active-directory': 'Active Directory',
  email: 'Email',
  general: 'General',
};

const STATUS_VARIANT: Record<ArticleStatus, 'default' | 'secondary'> = {
  published: 'default',
  draft: 'secondary',
};

const ALL_CATEGORIES: Array<ArticleCategory | 'all'> = [
  'all',
  'networking',
  'hardware',
  'software',
  'security',
  'active-directory',
  'email',
  'general',
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('articles')
      .select(
        'id, title, status, category, created_by, created_at, updated_at',
      );

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const sorted = (data ?? []).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
      setArticles(sorted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const filtered = articles.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || a.category === category;
    const matchStatus = status === 'all' || a.status === status;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <>
      <div className={'flex items-center justify-between'}>
        <div>
          <h1 className={'text-3xl font-semibold'}>Knowledge Base</h1>
          <p className={'text-muted-foreground'}>
            {loading
              ? 'Loading...'
              : `${filtered.length} article ${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <Button asChild>
          <Link href='/knowladge-base/new'>
            <Plus size={16} className={'mr-2'} />
            Write Article
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className={'flex flex-wrap gap-4 pt-5'}>
          <div className={'relative min-w-[220px] flex-2'}>
            <Search
              size={16}
              className={
                'absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground'
              }
            />
            <Input
              placeholder={'search articles...'}
              className={'pl-8'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={'flex gap-2'}>
            {ALL_CATEGORIES.map((c) => (
              <Button
                key={c}
                size={'sm'}
                variant={category === c ? 'default' : 'outline'}
                onClick={() => setCategory(c)}
                className={'capitalize'}
              >
                {c === 'all' ? 'All' : CATEGORY_LABELS[c as ArticleCategory]}
              </Button>
            ))}
          </div>
          <Button
            size={'sm'}
            variant={'ghost'}
            onClick={() => fetchArticles()}
            disabled={loading || !error}
          >
            <RefreshCw
              size={16}
              className={cn('animate-spin', loading && 'opacity-50')}
            />
          </Button>
        </CardContent>
      </Card>
      {error && (
        <div className={'space-y-4'}>
          <p className={'text-sm text-red-500'}>
            Failed to Load Articles: {error}
          </p>
          <Button
            size={'sm'}
            variant={'outline'}
            onClick={() => fetchArticles()}
          >
            Try Again
          </Button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div
          className={
            'flex flex-col items-center gap-4 py-14 text-muted-foreground'
          }
        >
          <BookOpen size={34} className={'opacity-30'} />
          <p className={'text-sm'}>No Articles Found</p>
          {(search || category !== 'all' || status !== 'all') && (
            <Button
              size={'sm'}
              variant={'ghost'}
              onClick={() => {
                setSearch('');
                setCategory('all');
                setStatus('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
      {filtered.map((article) => (
        <Card key={article.id}>
          <CardHeader>
            <CardTitle>{article.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={'text-sm text-muted-foreground'}>
              {formatDate(article.created_at)}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

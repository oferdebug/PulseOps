'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  FileText,
  Clock,
} from 'lucide-react';

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

const CATEGORY_COLOR: Record<ArticleCategory, string> = {
  networking: '#60a5fa',
  hardware: '#fb923c',
  software: '#a78bfa',
  security: '#f43f5e',
  'active-directory': '#34d399',
  email: '#fbbf24',
  general: '#9ca3af',
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Panel({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      <div
        className='h-[1px]'
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
        }}
      />
      {children}
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 hover:-translate-y-0.5'
      style={
        active
          ? {
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#a5b4fc',
            }
          : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
            }
      }
    >
      {label}
    </button>
  );
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
    const { data, error: e } = await supabase
      .from('articles')
      .select(
        'id, title, status, category, created_by, created_at, updated_at',
      );
    if (e) setError(e.message);
    else
      setArticles(
        (data ?? []).sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
      );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'all' || a.category === category) &&
      (status === 'all' || a.status === status),
  );

  return (
    <div
      className='relative min-h-screen space-y-6 p-8'
      style={{ background: '#06060f' }}
    >
      {/* Ambient */}
      <div
        className='pointer-events-none fixed inset-0 overflow-hidden'
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '30vw',
            height: '30vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className='relative' style={{ zIndex: 1 }}>
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 mb-6 flex items-end justify-between'
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <p
              className='mb-1 text-xs font-bold uppercase tracking-widest'
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Documentation
            </p>
            <h1
              className='text-4xl font-black tracking-tight'
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Knowledge Base
            </h1>
            <p
              className='mt-1 text-sm'
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {loading
                ? 'Loading…'
                : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href='/knowledge-base/new'
            className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90'
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow:
                '0 4px 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Plus size={14} /> Write Article
          </Link>
        </div>

        {/* Filters */}
        <Panel
          className='animate-fade-in-up opacity-0 mb-4'
          style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}
        >
          <div className='flex flex-wrap items-center gap-3 p-4'>
            <div className='relative min-w-[200px] flex-1'>
              <Search
                size={13}
                className='absolute left-3 top-1/2 -translate-y-1/2'
                style={{ color: 'rgba(255,255,255,0.25)' }}
              />
              <input
                placeholder='Search articles…'
                className='h-9 w-full rounded-xl pl-9 pr-4 text-sm outline-none'
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex flex-wrap gap-1.5'>
              {ALL_CATEGORIES.map((c) => (
                <Pill
                  key={c}
                  label={
                    c === 'all' ? 'All' : CATEGORY_LABELS[c as ArticleCategory]
                  }
                  active={category === c}
                  onClick={() => setCategory(c)}
                />
              ))}
            </div>
            <div className='flex gap-1.5'>
              {(['all', 'published', 'draft'] as const).map((s) => (
                <Pill
                  key={s}
                  label={s === 'all' ? 'All Status' : s}
                  active={status === s}
                  onClick={() => setStatus(s)}
                />
              ))}
            </div>
            <button
              type='button'
              onClick={fetchArticles}
              disabled={loading}
              className='flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10'
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
            </button>
          </div>
        </Panel>

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <Panel>
            <div
              className='flex flex-col items-center gap-3 py-16'
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <BookOpen size={36} />
              <p className='text-sm font-medium'>No articles found</p>
            </div>
          </Panel>
        )}

        {/* Articles grid */}
        {!error && filtered.length > 0 && (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {filtered.map((article, i) => {
              const catColor = CATEGORY_COLOR[article.category];
              return (
                <Link
                  key={article.id}
                  href={`/knowledge-base/${article.id}`}
                  className='animate-fade-in-up opacity-0 group block'
                  style={{
                    animationDelay: `${160 + i * 40}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  <div
                    className='relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1'
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {/* Top accent */}
                    <div
                      className='absolute inset-x-0 top-0 h-[1px]'
                      style={{
                        background: `linear-gradient(90deg, transparent, ${catColor}80, transparent)`,
                      }}
                    />

                    {/* Corner glow */}
                    <div
                      className='pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-15 blur-xl transition-opacity group-hover:opacity-30'
                      style={{ background: catColor }}
                    />

                    {/* Category badge */}
                    <div className='mb-3 flex items-center justify-between'>
                      <span
                        className='rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize'
                        style={{ background: `${catColor}20`, color: catColor }}
                      >
                        {CATEGORY_LABELS[article.category]}
                      </span>
                      <span
                        className='rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize'
                        style={
                          article.status === 'published'
                            ? {
                                background: 'rgba(74,222,128,0.15)',
                                color: '#86efac',
                              }
                            : {
                                background: 'rgba(251,191,36,0.15)',
                                color: '#fcd34d',
                              }
                        }
                      >
                        {article.status}
                      </span>
                    </div>

                    {/* Icon + Title */}
                    <div className='flex items-start gap-3'>
                      <div
                        className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'
                        style={{
                          background: `${catColor}15`,
                          border: `1px solid ${catColor}30`,
                        }}
                      >
                        <FileText size={14} style={{ color: catColor }} />
                      </div>
                      <p
                        className='text-sm font-semibold leading-snug'
                        style={{ color: 'rgba(255,255,255,0.85)' }}
                      >
                        {article.title}
                      </p>
                    </div>

                    {/* Footer */}
                    <div
                      className='mt-4 flex items-center gap-1.5'
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      <Clock size={11} />
                      <span className='text-[11px]'>
                        {timeAgo(article.updated_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

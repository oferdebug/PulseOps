'use client';

import { Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';

type ArticleStatus = 'draft' | 'published';
type ArticleCategory =
  | 'networking'
  | 'hardware'
  | 'software'
  | 'security'
  | 'active-directory'
  | 'email'
  | 'general';

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className='glass-card'>
      <div className='card-accent-line' />
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--app-surface)',
  border: '1px solid var(--app-border)',
  color: 'var(--app-text-primary)',
  borderRadius: '12px',
  outline: 'none',
  height: '40px',
  padding: '0 12px',
  width: '100%',
  fontSize: '14px',
};
const labelStyle: React.CSSProperties = {
  color: 'var(--app-text-muted)',
  fontSize: '11px',
  fontWeight: 700,
  marginBottom: '6px',
  display: 'block',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('general');
  const [status, setStatus] = useState<ArticleStatus>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!title.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      setContent(data.content ?? '');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error: err } = await supabase
      .from('articles')
      .insert({
        title: title.trim(),
        content: content.trim(),
        category,
        status,
        created_by: user?.id ?? null,
      })
      .select('id')
      .single();
    if (err) {
      toast.error(err.message);
      setSubmitting(false);
      return;
    }
    toast.success('Article created');
    router.push(`/knowledge-base/${data.id}`);
  }

  return (
    <div
      className='min-h-screen p-8'
      style={{ background: 'var(--app-bg)' }}
    >
      <div
        className='mx-auto max-w-3xl space-y-6'
        
      >
        <AppBreadcrumb current='New Article' />

        <div
          className='animate-fade-in-up opacity-0'
          style={{ animationFillMode: 'forwards' }}
        >
          <p
            className='mb-1 text-xs font-bold uppercase tracking-widest'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Documentation
          </p>
          <h1 className='text-xl font-bold tracking-tight' style={{ color: 'var(--app-text-primary)' }}>
            New Article
          </h1>
          <p
            className='mt-1 text-sm'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Write or generate a knowledge base article.
          </p>
        </div>

        <Panel>
          <div
            className='px-6 py-5'
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Article Details
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Fields marked * are required
            </p>
          </div>
          <form onSubmit={handleSubmit} className='space-y-5 p-6'>
            {/* Title + AI */}
            <div>
              <label htmlFor='article-title' style={labelStyle}>
                Title *
              </label>
              <div className='flex gap-2'>
                <input
                  id='article-title'
                  style={inputStyle}
                  placeholder='e.g. How to reset a user password in Active Directory'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={submitting || generating}
                />
                <button
                  type='button'
                  onClick={handleGenerate}
                  disabled={!title.trim() || generating || submitting}
                  className='flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-40'
                  style={{
                    background: 'var(--app-accent-dim)',
                    border: '1px solid var(--app-accent-border)',
                    color: 'var(--app-accent-text)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {generating ? (
                    <Loader2 size={13} className='animate-spin' />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  {generating ? 'Generating…' : 'Generate with AI'}
                </button>
              </div>
            </div>

            {/* Category + Status */}
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label htmlFor='category-select' style={labelStyle}>
                  Category *
                </label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as ArticleCategory)}
                  disabled={submitting}
                >
                  <SelectTrigger
                    id='category-select'
                    className='h-10 rounded-md text-sm'
                    style={{
                      background: 'var(--app-surface)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-text-primary)',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'general',
                      'networking',
                      'hardware',
                      'software',
                      'security',
                      'active-directory',
                      'email',
                    ].map((c) => (
                      <SelectItem key={c} value={c} className='capitalize'>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor='status-select' style={labelStyle}>
                  Status *
                </label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ArticleStatus)}
                  disabled={submitting}
                >
                  <SelectTrigger
                    id='status-select'
                    className='h-10 rounded-md text-sm'
                    style={{
                      background: 'var(--app-surface)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-text-primary)',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='draft'>Draft</SelectItem>
                    <SelectItem value='published'>Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor='content-markdown' style={labelStyle}>
                Content * (Markdown)
              </label>
              <textarea
                id='content-markdown'
                style={{
                  ...inputStyle,
                  height: 'auto',
                  minHeight: '280px',
                  padding: '12px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}
                placeholder='Write your article in Markdown, or click Generate with AI above…'
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={submitting || generating || !title.trim()}
              />
            </div>

            {error && (
              <div
                className='rounded-md px-4 py-3 text-sm'
                style={{
                  background:
                    'color-mix(in srgb, var(--destructive) 12%, transparent)',
                  border:
                    '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
                  color: 'var(--destructive)',
                }}
              >
                {error}
              </div>
            )}

            <div className='flex gap-3 pt-2'>
              <button
                type='submit'
                disabled={submitting || !title.trim() || !content.trim()}
                className='flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40'
                style={{
                  background: 'var(--app-accent)',
                  color: 'var(--primary-foreground)',
                }}
              >
                {submitting && <Loader2 size={14} className='animate-spin' />}
                {submitting ? 'Saving…' : 'Save Article'}
              </button>
              <Link
                href='/knowledge-base'
                className='flex items-center rounded-md px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/5'
                style={{
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-nav-idle-text)',
                }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}

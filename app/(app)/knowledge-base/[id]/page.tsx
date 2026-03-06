'use client';

import { ArrowLeft, Check, Loader2, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
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

interface ArticleRow {
  id: string;
  title: string;
  content: string;
  status: ArticleStatus;
  category: ArticleCategory;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<ArticleCategory>('general');
  const [editStatus, setEditStatus] = useState<ArticleStatus>('draft');

  useEffect(() => {
    const supabase = createClient();
    supabase.from('articles').select('*').eq('id', id).single().then(({ data, error: err }) => {
      if (err) setError(err.message);
      else setArticle(data);
      setLoading(false);
    });
  }, [id]);

  function enterEditMode() {
    if (!article) return;
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditCategory(article.category);
    setEditStatus(article.status);
    setEditing(true);
  }

  async function handleSave() {
    if (!article) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('articles')
      .update({
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
        status: editStatus,
      })
      .eq('id', id)
      .select()
      .single();
    if (err) setError(err.message);
    else {
      setArticle(data);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this article? This action cannot be undone.')) return;
    setDeleting(true);
    const supabase = createClient();
    const { error: err } = await supabase.from('articles').delete().eq('id', id);
    if (err) setError(err.message);
    else router.push('/knowledge-base');
    setDeleting(false);
  }

  const isAuthor = article?.created_by === user?.id;

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="section max-w-2xl">
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error ?? 'Article not found. Please try again.'}
        </p>
        <Button variant="outline" className="btn-secondary mt-4" asChild>
          <Link href="/knowledge-base">
            <ArrowLeft size={16} className="mr-2" />
            Back to Knowledge Base
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="section">
      <header className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" className="btn-secondary w-fit" asChild>
          <Link href="/knowledge-base">
            <ArrowLeft size={16} className="mr-2" />
            Back to Knowledge Base
          </Link>
        </Button>
        {isAuthor && !editing && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="btn-secondary" onClick={enterEditMode}>
              <Pencil size={16} className="mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </div>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button size="sm" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Check size={14} className="mr-2" />}
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" className="btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
              <X size={14} className="mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </header>

      <Card className="card-surface">
        <CardHeader className="pb-4">
          {editing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-bold border-border bg-background"
              disabled={saving}
            />
          ) : (
            <h1 className="text-2xl font-bold text-foreground">{article.title}</h1>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm border-border bg-background"
              disabled={saving}
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">{article.content}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

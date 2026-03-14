'use client';

import { ArrowLeft, Check, Loader2, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import FileUpload from '@/components/features/attachments/FileUpload';
import { ArticleStats } from '@/components/features/kb/ArticleStats';
import { RelatedArticles } from '@/components/features/kb/RelatedArticles';
import { TagInput } from '@/components/features/tags/TagInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useArticleAnalytics } from '@/hooks/useArticleAnalytics';
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

interface ArticlePageParams {
  id: string;
}

interface ArticlePageProps {
  params: Promise<ArticlePageParams>;
}

export default function ArticleDetailPage({ params }: ArticlePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();
  const analytics = useArticleAnalytics(id, user?.id);
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [editCategory, setEditCategory] = useState<ArticleCategory>('general');
  const [editStatus, setEditStatus] = useState<ArticleStatus>('draft');

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();
        if (err) setError(err.message);
        else {
          setArticle({
            ...data,
            content: (data.content ?? '').replace(/\\n/g, '\n'),
          });
          if (user?.id) analytics.recordView();
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'An unknown error occurred',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user?.id, analytics]);

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
    try {
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
      if (err) toast.error(err.message);
      else {
        setArticle({
          ...data,
          content: (data.content ?? '').replace(/\\n/g, '\n'),
        });
        setEditing(false);
        toast.success('Article updated');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save article',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this article? This action cannot be undone.'))
      return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
      if (err) {
        toast.error(err.message);
        setDeleting(false);
      } else {
        toast.success('Article deleted');
        await router.push('/knowledge-base');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete article',
      );
      setDeleting(false);
    }
  }

  const isAuthor = article?.created_by === user?.id;

  if (loading) {
    return (
      <div className='flex min-h-[240px] items-center justify-center'>
        <Loader2 size={24} className='animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className='section max-w-2xl'>
        <p className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
          {error ?? 'Article not found. Please try again.'}
        </p>
        <Button variant='outline' className='btn-secondary mt-4' asChild>
          <Link href='/knowledge-base'>
            <ArrowLeft size={16} className='mr-2' />
            Back to Knowledge Base
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='section'>
      <header className='page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <AppBreadcrumb current={article.title} />
        {isAuthor && !editing && (
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              className='btn-secondary'
              onClick={enterEditMode}
            >
              <Pencil size={16} className='mr-2' />
              Edit
            </Button>
            <Button
              size='sm'
              variant='ghost'
              className='text-destructive hover:bg-destructive/10'
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={16} className='mr-2' />
              Delete
            </Button>
          </div>
        )}
        {editing && (
          <div className='flex gap-2'>
            <Button
              size='sm'
              className='btn-primary'
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={14} className='mr-2 animate-spin' />
              ) : (
                <Check size={14} className='mr-2' />
              )}
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='btn-secondary'
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              <X size={14} className='mr-2' />
              Cancel
            </Button>
          </div>
        )}
      </header>

      <Card className='card-surface'>
        <CardHeader className='pb-4'>
          {editing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className='text-xl font-bold border-border bg-background'
              disabled={saving}
            />
          ) : (
            <h1 className='text-2xl font-bold text-foreground'>
              {article.title}
            </h1>
          )}
        </CardHeader>

        <CardContent className='space-y-4'>
          {editing ? (
            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='category'
                  className='block text-sm font-medium mb-2'
                >
                  Category
                </label>
                <Select
                  value={editCategory}
                  onValueChange={(v) => setEditCategory(v as ArticleCategory)}
                  disabled={saving}
                >
                  <SelectTrigger id='category' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='general'>General</SelectItem>
                    <SelectItem value='networking'>Networking</SelectItem>
                    <SelectItem value='hardware'>Hardware</SelectItem>
                    <SelectItem value='software'>Software</SelectItem>
                    <SelectItem value='security'>Security</SelectItem>
                    <SelectItem value='active-directory'>
                      Active Directory
                    </SelectItem>
                    <SelectItem value='email'>Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor='status'
                  className='block text-sm font-medium mb-2'
                >
                  Status
                </label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v as ArticleStatus)}
                  disabled={saving}
                >
                  <SelectTrigger id='status' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='draft'>Draft</SelectItem>
                    <SelectItem value='published'>Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className='min-h-[200px] font-mono text-sm border-border bg-background'
                disabled={saving}
              />
            </div>
          ) : (
            <article className='prose max-w-none'>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {article.content ?? ''}
              </ReactMarkdown>
            </article>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className='card-surface'>
        <CardContent className='pt-6'>
          <h3 className='mb-3 text-sm font-semibold'>Tags</h3>
          <TagInput entityType='article' entityId={id} />
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card className='card-surface'>
        <CardContent className='pt-6'>
          <h3 className='mb-3 text-sm font-semibold'>Attachments</h3>
          <FileUpload entityType='article' entityId={id} />
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card className='card-surface'>
        <CardContent className='pt-6'>
          <h3 className='mb-3 text-sm font-semibold'>Article Stats</h3>
          <ArticleStats articleId={id} userId={user?.id} />
        </CardContent>
      </Card>

      {/* Related Articles */}
      <Card className='card-surface'>
        <CardContent className='pt-6'>
          <h3 className='mb-3 text-sm font-semibold'>Related Articles</h3>
          <RelatedArticles articleId={id} category={article.category} />
        </CardContent>
      </Card>
    </div>
  );
}

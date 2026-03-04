/**
 * Article Detail Page — /knowledge-base/[id]
 *
 * Displays a full article with rendered Markdown.
 * Toggle between view mode and edit mode inline.
 * Only the article author can edit or delete.
 *
 * Architecture notes:
 * - Markdown is rendered using a simple approach with `white-space: pre-wrap`
 *   for now. Replace with a proper Markdown renderer (react-markdown) for
 *   full formatting support.
 * - Edit mode is inline — no separate route needed.
 * - Optimistic status update on publish/unpublish.
 *
 * TODO:
 * - Add react-markdown + rehype-highlight for proper rendering.
 * - Add AI "improve article" button in edit mode.
 * - Replace window.confirm with AlertDialog.
 */

'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Globe,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
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
    supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
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
    const { data, error } = await supabase
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

    if (error) {
      setError(error.message);
    } else {
      setArticle(data);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this article? This action cannot be undone.'))
      return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      router.push('/knowledge-base');
    }
    setDeleting(false);
    return;
  }

  const isAuthor = article?.created_by === user?.id;

  if (loading) {
    return (
      <div className={'flex h-48 items-center justify-center-safe'}>
        <Loader2 size={24} className={'animate-spin text-muted-foreground'} />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className={'space-y-6'}>
        <p className={'text-sm text-red-500'}>
          {error ?? 'Article Not Found,Please Try Again'}
        </p>
        <Button variant={'outline'} asChild>
          <Link href='/knowledge-base'>
            <ArrowLeft size={14} className={'mr-2'} />
            Back To Knowladge Base
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={'flex items-center justify-between'}>
      <Button variant={'ghost'} size={'sm'} asChild>
        <Link href={'/knowledge-base'}>
          <ArrowLeft size={16} className={'mr-2'} />
        </Link>
      </Button>

      {isAuthor && !editing && (
        <div className={'flex gap-2'}>
          <Button size={'sm'} variant={'outline'} onClick={enterEditMode}>
            <Pencil size={16} className={'mr-2'} />
            Edit The Document
          </Button>
          <Button size={'sm'} variant={'ghost'} className={'text-red-500 hover:text-red-600 hover:bg-red-50'} onClick={handleDelete} disabled={deleting}>
            <Trash2 size={16} className={'mr-2'} />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}

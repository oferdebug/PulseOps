/** biome-ignore-all lint/complexity/noUselessLoneBlockStatements: <explanation> */
/** biome-ignore-all assist/source/organizeImports: <explanation> */
'use client';
/**
 * New Article Page — /knowledge-base/new
 *
 * Form for creating a new article with a Markdown editor.
 * Includes AI-powered content generation via Anthropic API —
 * the user enters a title, clicks "Generate with AI", and gets
 * a full article draft they can edit before publishing.
 *
 * TODO:
 * - Replace raw textarea with a proper Markdown editor (e.g. @uiw/react-md-editor).
 * - Add image upload support via Supabase Storage.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

type ArticleStatus = 'draft' | 'published';
type ArticleCategory =
  | 'networking'
  | 'hardware'
  | 'software'
  | 'security'
  | 'active-directory'
  | 'email'
  | 'general';

export default function NewArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('general');
  const [status, setStatus] = useState('draft');
  const [submitting, setSubmitting] = useState(false);
  const [generation, setGeneration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!title.trim()) return;
    setGeneration(true);
    setError(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are an IT helpdesk knowledge base writer. 
Write a clear, practical knowledge base article for IT support staff about: ${title}.`,
            },
          ],
        }),
      });
      const responseData = await response.json();
      const text =
        responseData.content?.[0]?.text ??
        responseData.choices?.[0]?.message?.content ??
        '';
      setContent(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGeneration(false);
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
    const { data, error: insertError } = await supabase
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

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/knowledge-base/${data.id}`);
  }

  return (
    <>
      <div className={'mx-auto max-w-3xl space-y-6'}>
        <div className={'flex items-center gap-4'}>
          <Button variant={'ghost'} size={'sm'} asChild>
            <Link href={'/knowledge-base'}>
              <ArrowLeft size={16} className={'mr-2'} />
              Back To Knowledge Base
            </Link>
          </Button>

          <h1 className={'text-3xl font-semibold'}>New Article</h1>
          <p className={'text-muted-foreground'}>
            Write or generate a knowledge base article.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
          <CardDescription>Fields Marked * Are Required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={'space-y-7'}>
            <div className={'space-y-2'}>
              <Label htmlFor={'title'}>Title *</Label>
              <div className={'flex gap-2'}>
                <Input
                  id='title'
                  placeholder='e.g How To Reset A User Password Inside Of Active Directory'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={submitting || generation}
                  className={'flex-2'}
                />
                <Button
                  type={'button'}
                  variant={'outline'}
                  onClick={handleGenerate}
                  disabled={!title.trim() || generation || submitting}
                >
                  {generation ? (
                    <Loader2 size={14} className={'mr-2 animate-spin'} />
                  ) : (
                    <Sparkles size={14} className={'mr-2'} />
                  )}
                  {generation ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
            </div>

            <div className={'flex gap-4'}>
              <div className={'space-y-2  flex-2'}>
                <Label htmlFor={'category'}>Category *</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as ArticleCategory)}
                  disabled={submitting}
                >
                  <SelectTrigger id='category'>
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

              <div className='space-y-1.5 flex-1'>
                <Label htmlFor='status'>Status *</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ArticleStatus)}
                  disabled={submitting}
                >
                  <SelectTrigger id='status'>
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
            <div className='space-y-1.5'>
              <Label htmlFor='content'>Content * (Markdown)</Label>
              <Textarea
                id='content'
                placeholder="Write your article in Markdown, or click 'Generate with AI' above…"
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={submitting || generation || !title.trim()}
                className='font-mono text-sm'
              />
            </div>

            {error && <p className='text-sm text-red-500'>{error}</p>}

            {/* Actions */}
            <div className='flex items-center gap-3 pt-2'>
              <Button
                type='submit'
                disabled={submitting || !title.trim() || !content.trim()}
              >
                {submitting && (
                  <Loader2 size={14} className='mr-2 animate-spin' />
                )}
                {submitting ? 'Saving…' : 'Save Article'}
              </Button>
              <Button type='button' variant='ghost' asChild>
                <Link href='/knowledge-base'>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

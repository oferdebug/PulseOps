/** biome-ignore-all assist/source/organizeImports: <explanation> */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ArrowLeft, Loader2 } from 'lucide-react';

/**
 * NewTicketPage
 *
 * Form for creating a new ticket. Submits to Supabase and redirects
 * to the ticket detail page on success.
 */

type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export default function NewTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: 'open',
        created_by: user?.id ?? null,
      })
      .select('id')
      .single();

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    router.push(`/tickets/${data.id}`);
  }

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' asChild>
          <Link href='/tickets'>
            <ArrowLeft size={16} className='mr-2' />
            Back To Tickets
          </Link>
        </Button>
        <h1 className='text-3xl font-semibold'>New Ticket</h1>
        <p className='text-muted-foreground'>
          Describe the issue and we&apos;ll get it logged.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Ticket Details</CardTitle>
          <CardDescription>
            All Fields Marked With * Are Required
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-3'>
              <Label htmlFor='title'>
                Title <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Enter the title of the ticket'
                required
                disabled={submitting}
              />
            </div>
            <div className='space-y-3'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Describe the issue in detail — steps to reproduce, affected users, error messages…'
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className='space-y-3'>
              <Label htmlFor='priority'>Priority *</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TicketPriority)}
                disabled={submitting}
              >
                <SelectTrigger id='priority' className='w-48'>
                  <SelectValue placeholder='Select Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='critical'>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className='text-sm text-red-500'>Error: {error}</p>}
            <div className='flex items-center gap-4 pt-4'>
              <Button type='submit' disabled={submitting || !title.trim()}>
                {submitting && (
                  <Loader2 size={16} className='mr-2 animate-spin' />
                )}
                {submitting ? 'Submitting...' : 'Open Ticket'}
              </Button>
              <Button type='button' variant='ghost' asChild>
                <Link href='/tickets'>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

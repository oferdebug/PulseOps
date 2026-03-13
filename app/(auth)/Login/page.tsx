'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const form = useForm<FieldValues>({
    defaultValues: { email: '', password: '' },
  });
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(data: FieldValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (err) {
      toast.error(err.message);
      setSubmitting(false);
      return;
    }
    toast.success('Welcome back!');
    setSubmitting(false);
    router.push('/dashboard');
  }

  return (
    <div
      className='animate-fade-in-up opacity-0'
      style={{ animationFillMode: 'forwards' }}
    >
      <Card
        className='w-[400px]'
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          borderRadius: '12px',
          boxShadow: 'var(--app-shadow-lg)',
        }}
      >
        <CardHeader className='space-y-3 px-6 pt-6 pb-0'>
          <Logo />
          <div>
            <h1
              className='text-lg font-bold tracking-tight'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Sign in to PulseOps
            </h1>
            <p
              className='mt-0.5 text-sm'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Enter your credentials to access the console.
            </p>
          </div>
        </CardHeader>
        <CardContent className='px-6 pb-6 pt-4'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <FormField
                control={form.control}
                name='email'
                rules={{ required: 'Email is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor='email'
                      className='text-xs font-medium'
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='email'
                        type='email'
                        placeholder='you@company.com'
                        className='h-9 rounded-md text-sm'
                        style={{
                          background: 'var(--app-bg)',
                          border: '1px solid var(--app-border)',
                          color: 'var(--app-text-primary)',
                        }}
                        disabled={submitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                rules={{ required: 'Password is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor='password'
                      className='text-xs font-medium'
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='password'
                        type='password'
                        placeholder='••••••••'
                        className='h-9 rounded-md text-sm'
                        style={{
                          background: 'var(--app-bg)',
                          border: '1px solid var(--app-border)',
                          color: 'var(--app-text-primary)',
                        }}
                        disabled={submitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type='submit'
                disabled={submitting}
                className='h-9 w-full rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50'
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                }}
              >
                {submitting && (
                  <Loader2 size={14} className='mr-2 animate-spin' />
                )}
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </Form>
          <p
            className='mt-6 text-center text-sm'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Don&apos;t have an account?{' '}
            <Link
              href='/Register'
              className='font-medium underline-offset-4 hover:underline'
              style={{ color: 'var(--app-accent-text)' }}
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

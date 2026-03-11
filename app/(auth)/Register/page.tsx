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

export default function RegisterPage() {
  const form = useForm<FieldValues>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(data: FieldValues) {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName } },
    });
    if (err) {
      toast.error(err.message);
      setSubmitting(false);
      return;
    }
    toast.success('Account created — welcome to PulseOps!');
    router.push('/dashboard');
  }

  const inputStyle = {
    background: 'var(--app-bg)',
    border: '1px solid var(--app-border)',
    color: 'var(--app-text-primary)',
  };

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
              Create your account
            </h1>
            <p
              className='mt-0.5 text-sm'
              style={{ color: 'var(--app-text-secondary)' }}
            >
              Register to start using PulseOps.
            </p>
          </div>
        </CardHeader>
        <CardContent className='px-6 pb-6 pt-4'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              <FormField
                control={form.control}
                name='fullName'
                rules={{ required: 'Full name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className='text-xs font-medium'
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Full name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Jane Doe'
                        className='h-9 rounded-md text-sm'
                        style={inputStyle}
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
                name='email'
                rules={{ required: 'Email is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor='reg-email'
                      className='text-xs font-medium'
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='reg-email'
                        type='email'
                        placeholder='you@company.com'
                        className='h-9 rounded-md text-sm'
                        style={inputStyle}
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
                rules={{
                  required: 'Password is required',
                  minLength: { value: 6, message: 'At least 6 characters' },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor='reg-password'
                      className='text-xs font-medium'
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='reg-password'
                        type='password'
                        placeholder='••••••••'
                        className='h-9 rounded-md text-sm'
                        style={inputStyle}
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
                name='confirmPassword'
                rules={{ required: 'Confirm your password' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      htmlFor='reg-confirm'
                      className='text-xs font-medium'
                      style={{ color: 'var(--app-text-secondary)' }}
                    >
                      Confirm password
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='reg-confirm'
                        type='password'
                        placeholder='••••••••'
                        className='h-9 rounded-md text-sm'
                        style={inputStyle}
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
                {submitting ? 'Creating…' : 'Create account'}
              </Button>
            </form>
          </Form>
          <p
            className='mt-6 text-center text-sm'
            style={{ color: 'var(--app-text-secondary)' }}
          >
            Already have an account?{' '}
            <Link
              href='/Login'
              className='font-medium underline-offset-4 hover:underline'
              style={{ color: 'var(--app-accent-text)' }}
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

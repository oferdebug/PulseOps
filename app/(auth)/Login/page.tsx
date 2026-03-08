'use client';

import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';

export default function LoginPage() {
  const form = useForm<FieldValues>({
    defaultValues: { email: '', password: '' },
  });
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(data: FieldValues) {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="auth-layout">
      <Card className="auth-card">
        <CardHeader className="space-y-4 px-0 pt-0">
          <Logo />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sign in to PulseOps
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to access the helpdesk.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <FormLabel htmlFor="email" className="form-label">
                      Email
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      Your account email
                    </FormDescription>
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        className="h-10 border-border bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <FormLabel htmlFor="password" className="form-label">
                      Password
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      Your password
                    </FormDescription>
                    <FormControl>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="h-10 border-border bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="btn-primary h-10 w-full">
                Sign in
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

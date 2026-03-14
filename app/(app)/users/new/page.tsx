'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Panel } from '@/components/ui/panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@/hooks/useRole';

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

export default function NewUserPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      // Call server-side API that uses the service role key
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          role,
          department: department.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        const msg = result.error ?? 'Failed to create user';
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success('User created');
      router.push(`/users/${result.id}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Network error creating user';
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className='min-h-screen p-8' style={{ background: 'var(--app-bg)' }}>
      <div className='mx-auto max-w-2xl space-y-6'>
        <AppBreadcrumb current='New User' />

        <div
          className='animate-fade-in-up opacity-0'
          style={{ animationFillMode: 'forwards' }}
        >
          <p
            className='mb-1 text-xs font-bold uppercase tracking-widest'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Team
          </p>
          <h1
            className='text-xl font-bold tracking-tight'
            style={{ color: 'var(--app-text-primary)' }}
          >
            Add User
          </h1>
          <p
            className='mt-1 text-sm'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Add a new user to PulseOps.
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
              User Details
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Fields marked * are required
            </p>
          </div>
          <form onSubmit={handleSubmit} className='space-y-5 p-6'>
            <div>
              <label htmlFor='full-name' style={labelStyle}>
                Full Name *
              </label>
              <input
                id='full-name'
                style={inputStyle}
                placeholder='e.g. Dana Cohen'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor='email' style={labelStyle}>
                Email *
              </label>
              <input
                id='email'
                type='email'
                style={inputStyle}
                placeholder='e.g. dana@company.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label htmlFor='role-select' style={labelStyle}>
                  Role *
                </label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as UserRole)}
                  disabled={submitting}
                >
                  <SelectTrigger
                    id='role-select'
                    className='h-10 text-sm'
                    style={{
                      background: 'var(--app-surface)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-text-primary)',
                      borderRadius: '12px',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='customer'>Customer</SelectItem>
                    <SelectItem value='agent'>Agent</SelectItem>
                    <SelectItem value='admin'>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor='department' style={labelStyle}>
                  Department
                </label>
                <input
                  id='department'
                  style={inputStyle}
                  placeholder='e.g. IT, HR, Finance'
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor='phone' style={labelStyle}>
                Phone
              </label>
              <input
                id='phone'
                type='tel'
                style={inputStyle}
                placeholder='e.g. +972-50-000-0000'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
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
                disabled={submitting || !fullName.trim() || !email.trim()}
                className='flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
                style={{
                  background: 'var(--app-accent)',
                  color: 'var(--primary-foreground)',
                }}
              >
                {submitting && <Loader2 size={14} className='animate-spin' />}
                {submitting ? 'Saving…' : 'Add User'}
              </button>
              <Link
                href='/users'
                className='flex items-center rounded-md px-4 py-2.5 text-sm font-medium transition-all hover:bg-(--app-surface-raised)'
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

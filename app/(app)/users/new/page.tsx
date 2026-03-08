'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
/**
 * New User Page — /users/new
 *
 * Creates a new user via Supabase Auth Admin API (invite by email).
 * Profile is auto-created by the on_auth_user_created trigger.
 *
 * Note: Supabase's inviteUserByEmail requires the service role key,
 * so we route through a Next.js API endpoint.
 *
 * TODO:
 * - Add avatar upload via Supabase Storage.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';

type UserRole = 'admin' | 'technician' | 'user';

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

export default function NewUserPage() {
  const router = useRouter();
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

type UserRole = 'admin' | 'technician' | 'user';

export default function NewUserPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase

    setSubmitting(true);
    setError(null);

    const supabase = createClient();

    // Insert directly into profiles (for users already in auth.users)
    // In production, use /api/invite-user for new signups
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        department: department.trim() || null,
        phone: phone.trim() || null,
      })
      .select('id')
      .single();
    if (err) {
      setError(err.message);
      setSubmitting(false);
      return;
    }

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    router.push(`/users/${data.id}`);
  }

  return (
    <div
      className='relative min-h-screen p-8'
      style={{ background: 'var(--app-bg)' }}
    >
      <div className='app-mesh pointer-events-none fixed inset-0' style={{ zIndex: 0 }} />

      <div
        className='relative mx-auto max-w-2xl space-y-6'
        style={{ zIndex: 1 }}
      >
        <Link
          href='/users'
          className='inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-(--app-surface-raised)'
          style={{
            border: '1px solid var(--app-border)',
            color: 'var(--app-nav-idle-text)',
          }}
        >
          <ArrowLeft size={13} /> Back to Users
        </Link>

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
          <h1 className='text-4xl font-black tracking-tight text-gradient-primary'>
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
            <p className='text-sm font-bold' style={{ color: 'var(--app-text-primary)' }}>User Details</p>
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
    <div className='mx-auto max-w-2xl space-y-6'>
      {/* ── Header ── */}
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='sm' asChild>
          <Link href='/users'>
            <ArrowLeft size={16} className='mr-1' />
            Back
          </Link>
        </Button>
        <div>
          <h1 className='text-3xl font-semibold'>Add User</h1>
          <p className='text-muted-foreground'>Add a new user to PulseOps.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>User Details</CardTitle>
          <CardDescription>Fields marked * are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Full Name */}
            <div className='space-y-1.5'>
              <Label htmlFor='fullName'>Full Name *</Label>
              <Input
                id='fullName'
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
            {/* Email */}
            <div className='space-y-1.5'>
              <Label htmlFor='email'>Email *</Label>
              <Input
                id='email'
                type='email'
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
            {/* Role + Department */}
            <div className='flex gap-4'>
              <div className='space-y-1.5 flex-1'>
                <Label htmlFor='role'>Role *</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as UserRole)}
                  disabled={submitting}
                >
                  <SelectTrigger
                    id='role-select'
                    className='h-10 rounded-xl text-sm'
style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-primary)',
                  }}
                  >
                  <SelectTrigger id='role'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='user'>User</SelectItem>
                    <SelectItem value='technician'>Technician</SelectItem>
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

              <div className='space-y-1.5 flex-1'>
                <Label htmlFor='department'>Department</Label>
                <Input
                  id='department'
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
            {/* Phone */}
            <div className='space-y-1.5'>
              <Label htmlFor='phone'>Phone</Label>
              <Input
                id='phone'
                type='tel'
                placeholder='e.g. +972-50-000-0000'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
              />
            </div>

            {error && (
              <div
                className='rounded-xl px-4 py-3 text-sm'
                style={{
                  background: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
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
                className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
                style={{
                  background: 'var(--app-accent)',
                  color: 'var(--primary-foreground)',
                  boxShadow: '0 4px 20px var(--app-accent-dim)',
                }}
              >
                {submitting && <Loader2 size={14} className='animate-spin' />}
                {submitting ? 'Saving…' : 'Add User'}
              </button>
              <Link
                href='/users'
                className='flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-(--app-surface-raised)'
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
            {error && <p className='text-sm text-red-500'>{error}</p>}

            <div className='flex items-center gap-3 pt-2'>
              <Button
                type='submit'
                disabled={submitting || !fullName.trim() || !email.trim()}
              >
                {submitting && (
                  <Loader2 size={14} className='mr-2 animate-spin' />
                )}
                {submitting ? 'Saving…' : 'Add User'}
              </Button>
              <Button type='button' variant='ghost' asChild>
                <Link href='/users'>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

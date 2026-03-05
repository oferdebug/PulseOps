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

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    router.push(`/users/${data.id}`);
  }

  return (
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

            {/* Role + Department */}
            <div className='flex gap-4'>
              <div className='space-y-1.5 flex-1'>
                <Label htmlFor='role'>Role *</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as UserRole)}
                  disabled={submitting}
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

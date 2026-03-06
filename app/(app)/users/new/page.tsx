'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
    <div
      className='overflow-hidden rounded-2xl'
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className='h-px'
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
        }}
      />
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.85)',
  borderRadius: '12px',
  outline: 'none',
  height: '40px',
  padding: '0 12px',
  width: '100%',
  fontSize: '14px',
};
const labelStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
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
    router.push(`/users/${data.id}`);
  }

  return (
    <div
      className='relative min-h-screen p-8'
      style={{ background: '#06060f' }}
    >
      <div className='pointer-events-none fixed inset-0' style={{ zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div
        className='relative mx-auto max-w-2xl space-y-6'
        style={{ zIndex: 1 }}
      >
        <Link
          href='/users'
          className='inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-white/5'
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)',
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
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Team
          </p>
          <h1
            className='text-4xl font-black tracking-tight'
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Add User
          </h1>
          <p
            className='mt-1 text-sm'
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Add a new user to PulseOps.
          </p>
        </div>

        <Panel>
          <div
            className='px-6 py-5'
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className='text-sm font-bold text-white'>User Details</p>
            <p className='text-xs' style={{ color: 'rgba(255,255,255,0.3)' }}>
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
                    className='h-10 rounded-xl text-sm'
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.85)',
                    }}
                  >
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
                className='rounded-xl px-4 py-3 text-sm'
                style={{
                  background: 'rgba(244,63,94,0.1)',
                  border: '1px solid rgba(244,63,94,0.2)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            <div className='flex gap-3 pt-2'>
              <button
                type='submit'
                disabled={submitting || !fullName.trim() || !email.trim()}
                className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40'
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                }}
              >
                {submitting && <Loader2 size={14} className='animate-spin' />}
                {submitting ? 'Saving…' : 'Add User'}
              </button>
              <Link
                href='/users'
                className='flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/5'
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
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

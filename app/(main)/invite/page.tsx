'use client';

import { ArrowRight, Building2, Loader2, Zap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface InvitationData {
  email: string;
  role: string;
  organization: { name: string; slug: string };
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center'>
          <Loader2
            className='h-6 w-6 animate-spin'
            style={{ color: 'var(--app-accent)' }}
          />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from('invitations')
      .select('email,role,status,expires_at, organizations(name,slug)')
      .eq('token', token)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Invitation not found');
          setLoading(false);
        } else if (data.status !== 'pending') {
          setError('This invitation has already been used');
          setLoading(false);
        } else if (new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
        } else {
          const org = data.organizations?.[0];
          setInvitation({
            email: data.email,
            role: data.role,
            organization: {
              name: org?.name ?? '',
              slug: org?.slug ?? '',
            },
          });
          setLoading(false);
        }
      });
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setJoining(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      localStorage.setItem('pending_invite_token', token);
      router.push(`/Register?invite=${token}`);
      return;
    }

    const { error: fnErr } = await supabase.rpc('accept_invitation', {
      invite_token: token,
    });

    if (fnErr) {
      setError(fnErr.message);
      setJoining(false);
      return;
    }

    router.push('/dashboard');
  }
  return (
    <div
      className='min-h-screen flex flex-col items-center justify-center p-6'
      style={{ background: 'var(--app-bg)' }}
    >
      <div className='w-full max-w-md space-y-6' >
        <div
          className='flex h-10 w-10 items-center justify-center rounded-md'
          style={{ background: '#10b981' }}
        >
          <Zap size={18} color='#fff' />
        </div>
        <span
          className='text-xl font-bold tracking-tight'
          style={{ color: 'var(--app-text-primary)' }}
        >
          PulseOps
        </span>
      </div>

      <div className='glass-card'>
        <div className='card-accent-line' />
        <div className='p-8 space-y-6'>
          {loading ? (
            <div className='flex justify-center py-8'>
              <Loader2
                size={24}
                className='animate-spin'
                style={{ color: 'var(--app-accent)' }}
              />
            </div>
          ) : error ? (
            <div className='text-center space-y-3 py-4'>
              <p
                className='text-sm font-bold'
                style={{ color: 'var(--destructive)' }}
              >
                {error}
              </p>
              <button
                type='button'
                onClick={() => router.push('/Login')}
                className='text-xs underline'
                style={{ color: 'var(--app-text-muted)' }}
              >
                Go to Login
              </button>
            </div>
          ) : invitation ? (
            <>
              <div className='flex items-center gap-3'>
                <div
                  className='flex h-10 w-10 items-center justify-center rounded-md'
                  style={{
                    background: 'var(--app-accent-dim)',
                    border: '1px solid var(--app-accent-border)',
                  }}
                >
                  <Building2
                    size={18}
                    style={{ color: 'var(--app-accent-text)' }}
                  />
                </div>
                <div>
                  <h1
                    className='text-lg font-bold'
                    style={{ color: 'var(--app-text-primary)' }}
                  >
                    You're invited!
                  </h1>
                  <p
                    className='text-xs'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Join {invitation.organization.name}
                  </p>
                </div>
              </div>

              <div
                className='rounded-md p-4 space-y-2'
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                }}
              >
                <div className='flex justify-between text-xs'>
                  <span style={{ color: 'var(--app-text-muted)' }}>
                    Organization
                  </span>
                  <span
                    className='font-bold'
                    style={{ color: 'var(--app-text-primary)' }}
                  >
                    {invitation.organization.name}
                  </span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span style={{ color: 'var(--app-text-muted)' }}>Role</span>
                  <span
                    className='font-bold capitalize'
                    style={{ color: 'var(--app-accent-text)' }}
                  >
                    {invitation.role}
                  </span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span style={{ color: 'var(--app-text-muted)' }}>Email</span>
                  <span
                    className='font-bold'
                    style={{ color: 'var(--app-text-primary)' }}
                  >
                    {invitation.email}
                  </span>
                </div>
              </div>

              <button
                type='button'
                onClick={handleAccept}
                disabled={joining}
                className='w-full flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
                style={{
                  background: 'var(--app-accent)',
                  color: 'var(--primary-foreground)',
                }}
              >
                {joining ? (
                  <Loader2 size={15} className='animate-spin' />
                ) : (
                  <>
                    Accept & Join <ArrowRight size={15} />
                  </>
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

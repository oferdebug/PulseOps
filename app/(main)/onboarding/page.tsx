'use client';

import { ArrowRight, Building2, Loader2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(val: string) {
    setName(val);
    setSlug(slugify(val));
  }

  async function handleSubmit() {
    if (!name.trim() || !slug.trim() || !user?.id) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: fnErr } = await supabase.rpc('create_organization', {
      org_name: name.trim(),
      org_slug: slug.trim(),
    });

    if (fnErr) {
      setError(fnErr.message);
      setLoading(false);
      return;
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ organization_id: data.org_id, role: 'admin' })
      .eq('id', user.id);

    if (profileErr) {
      // Rollback: delete the created organization
      const { error: rollbackErr } = await supabase
        .from('organizations')
        .delete()
        .eq('id', data.org_id);
      if (rollbackErr) {
        console.error('Failed to rollback organization:', rollbackErr);
      }
      setError(profileErr.message);
      setLoading(false);
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
        {/* Logo */}
        <div className='flex items-center gap-3 justify-center mb-8'>
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

        {/* Card */}
        <div className='glass-card'>
          <div className='card-accent-line' />
          <div className='p-8 space-y-6'>
            {/* Header */}
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
                  Create your organization
                </h1>
                <p
                  className='text-xs'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  You'll be the admin
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className='space-y-4'>
              <div className='space-y-1.5'>
                <label
                  htmlFor='org-name'
                  className='text-xs font-medium'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Organization Name
                </label>
                <input
                  id='org-name'
                  type='text'
                  placeholder='Acme IT Department'
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className='w-full rounded-md px-4 py-2.5 text-sm outline-none transition-all'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      'var(--app-accent-border)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--app-border)';
                  }}
                />
              </div>

              <div className='space-y-1.5'>
                <label
                  htmlFor='org-slug'
                  className='text-xs font-medium'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Slug
                </label>
                <div
                  className='flex items-center rounded-md overflow-hidden'
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                  }}
                >
                  <span
                    className='px-3 text-xs border-r'
                    style={{
                      color: 'var(--app-text-faint)',
                      borderColor: 'var(--app-border)',
                    }}
                  >
                    pulseops.app/
                  </span>
                  <input
                    id='org-slug'
                    type='text'
                    placeholder='acme-it'
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className='flex-1 bg-transparent px-3 py-2.5 text-sm outline-none'
                    style={{ color: 'var(--app-text-primary)' }}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className='text-xs' style={{ color: 'var(--destructive)' }}>
                {error}
              </p>
            )}

            <button
              type='button'
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !slug.trim()}
              className='w-full flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
              style={{
                background: 'var(--app-accent)',
                color: '#fff',
              }}
            >
              {loading ? (
                <Loader2 size={15} className='animate-spin' />
              ) : (
                <>
                  Create Organization <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

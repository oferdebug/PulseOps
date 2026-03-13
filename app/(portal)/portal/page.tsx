'use client';

import { BookOpen, Loader2, Plus, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';

interface TicketSummary {
  total: number;
  open: number;
  closed: number;
}

export default function PortalHomePage() {
  const { user } = useCurrentUser();
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('tickets')
        .select('id, status')
        .eq('created_by', user.id);

      const tickets = data ?? [];
      setSummary({
        total: tickets.length,
        open: tickets.filter((t) => t.status !== 'closed').length,
        closed: tickets.filter((t) => t.status === 'closed').length,
      });
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className='space-y-8'>
      {/* Welcome */}
      <div
        className='animate-fade-in-up opacity-0'
        style={{ animationFillMode: 'forwards' }}
      >
        <h1
          className='text-3xl font-bold tracking-tight'
          style={{ color: 'var(--app-text-primary)' }}
        >
          Welcome back, {user?.fullName ?? 'there'}
        </h1>
        <p className='mt-1 text-sm' style={{ color: 'var(--app-text-muted)' }}>
          How can we help you today?
        </p>
      </div>

      {/* Quick actions */}
      <div
        className='animate-fade-in-up opacity-0 grid grid-cols-1 gap-4 sm:grid-cols-3'
        style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
      >
        <Link
          href='/portal/my-tickets?new=true'
          className='glass-card flex items-center gap-4 p-6 transition-all duration-200 hover:-translate-y-1'
        >
          <div className='card-accent-line' />
          <div
            className='flex h-12 w-12 shrink-0 items-center justify-center rounded-md'
            style={{
              background: 'var(--app-accent-dim)',
              border: '1px solid var(--app-accent-border)',
            }}
          >
            <Plus size={20} style={{ color: 'var(--app-accent-text)' }} />
          </div>
          <div>
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Submit a Ticket
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Report an issue or request help
            </p>
          </div>
        </Link>

        <Link
          href='/portal/my-tickets'
          className='glass-card flex items-center gap-4 p-6 transition-all duration-200 hover:-translate-y-1'
        >
          <div className='card-accent-line' />
          <div
            className='flex h-12 w-12 shrink-0 items-center justify-center rounded-md'
            style={{
              background:
                'color-mix(in srgb, var(--app-stat-open) 15%, transparent)',
              border:
                '1px solid color-mix(in srgb, var(--app-stat-open) 30%, transparent)',
            }}
          >
            <Ticket size={20} style={{ color: 'var(--app-stat-open)' }} />
          </div>
          <div>
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              My Tickets
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Track your requests
            </p>
          </div>
        </Link>

        <Link
          href='/portal/knowledge-base'
          className='glass-card flex items-center gap-4 p-6 transition-all duration-200 hover:-translate-y-1'
        >
          <div className='card-accent-line' />
          <div
            className='flex h-12 w-12 shrink-0 items-center justify-center rounded-md'
            style={{
              background:
                'color-mix(in srgb, var(--app-stat-users) 15%, transparent)',
              border:
                '1px solid color-mix(in srgb, var(--app-stat-users) 30%, transparent)',
            }}
          >
            <BookOpen size={20} style={{ color: 'var(--app-stat-users)' }} />
          </div>
          <div>
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Knowledge Base
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              Find answers yourself
            </p>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div
        className='animate-fade-in-up opacity-0'
        style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
      >
        <div className='glass-card overflow-hidden'>
          <div className='card-accent-line' />
          <div
            className='px-6 py-4'
            style={{ borderBottom: '1px solid var(--app-border)' }}
          >
            <p
              className='text-sm font-bold'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Your Summary
            </p>
          </div>
          {loading ? (
            <div className='flex justify-center py-8'>
              <Loader2
                size={16}
                className='animate-spin'
                style={{ color: 'var(--app-text-faint)' }}
              />
            </div>
          ) : (
            <div
              className='grid grid-cols-3 divide-x'
              style={{ borderColor: 'var(--app-border)' }}
            >
              <div className='px-6 py-5 text-center'>
                <p
                  className='text-2xl font-bold'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  {summary?.total ?? 0}
                </p>
                <p
                  className='text-xs'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Total Tickets
                </p>
              </div>
              <div className='px-6 py-5 text-center'>
                <p
                  className='text-2xl font-bold'
                  style={{ color: 'var(--app-stat-open)' }}
                >
                  {summary?.open ?? 0}
                </p>
                <p
                  className='text-xs'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Open
                </p>
              </div>
              <div className='px-6 py-5 text-center'>
                <p
                  className='text-2xl font-bold'
                  style={{ color: 'var(--app-stat-closed)' }}
                >
                  {summary?.closed ?? 0}
                </p>
                <p
                  className='text-xs'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Resolved
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

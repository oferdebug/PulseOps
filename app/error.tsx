'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div
      className='flex min-h-screen flex-col items-center justify-center gap-4 p-8'
      style={{
        background: 'var(--app-background)',
        color: 'var(--app-text-primary)',
      }}
    >
      <div
        className='flex h-16 w-16 items-center justify-center rounded-lg text-2xl'
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
        }}
      >
        <span aria-hidden='true'>⚠️</span>
      </div>
      <h1 className='text-xl font-bold'>Something Went Wrong</h1>
      <p
        className='max-w-sm text-center text-sm'
        style={{ color: 'var(--app-text-muted)' }}
      >
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      <button
        type='button'
        onClick={reset}
        className='mt-2 rounded-md px-6 py-2.5 text-sm font-bold transition-all hover:opacity-90'
        style={{ background: 'var(--app-accent)', color: '#fff' }}
      >
        Try Again
      </button>
    </div>
  );
}

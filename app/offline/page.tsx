'use client';

export default function OfflinePage() {
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
        📡
      </div>
      <h1 className='text-xl font-bold'>You&apos;re Offline</h1>
      <p
        className='max-w-sm text-center text-sm'
        style={{ color: 'var(--app-text-muted)' }}
      >
        PulseOps requires an internet connection. Please check your network and
        try again.
      </p>
      <button
        type='button'
        onClick={() => window.location.reload()}
        className='mt-2 rounded-md px-6 py-2.5 text-sm font-bold transition-all hover:opacity-90'
        style={{ background: 'var(--app-accent)', color: '#fff' }}
      >
        Retry
      </button>
    </div>
  );
}

import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href='/dashboard' className='group flex items-center gap-3'>
      <div
        className='flex h-9 w-9 items-center justify-center rounded-lg'
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
        }}
      >
        <Zap size={16} color='#fff' />
      </div>
      <span
        className='text-base font-bold tracking-tight'
        style={{ color: 'var(--app-text-primary)' }}
      >
        PulseOps
      </span>
    </Link>
  );
}

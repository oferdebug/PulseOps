import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href='/dashboard' className='group flex items-center gap-3'>
      <div
        className='flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105'
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow:
            '0 4px 16px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <Zap size={16} color='#fff' />
      </div>
      <span className='text-base font-black tracking-tight'>
        <span style={{ color: 'rgba(255,255,255,0.9)' }}>Pulse</span>
        <span
          style={{
            background: 'linear-gradient(135deg, #a5b4fc, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Ops
        </span>
      </span>
    </Link>
  );
}

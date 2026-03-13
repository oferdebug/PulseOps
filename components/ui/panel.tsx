import type React from 'react';

export function Panel({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`glass-card ${className}`} style={style}>
      <div className='card-accent-line' />
      {children}
    </div>
  );
}

'use client';

import { Download } from 'lucide-react';
import { exportToCSV } from '@/lib/export/csv';

interface ExportButtonProps {
  getData: () => Record<string, unknown>[];
  filename: string;
  label?: string;
}

export function ExportButton({
  getData,
  filename,
  label = 'Export CSV',
}: ExportButtonProps) {
  const handleExport = () => {
    const rows = getData();
    if (rows.length === 0) return;
    exportToCSV(rows, filename);
  };

  return (
    <button
      type='button'
      onClick={handleExport}
      className='flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors hover:bg-[var(--app-surface-raised)]'
      style={{
        border: '1px solid var(--app-border)',
        color: 'var(--app-text-muted)',
      }}
    >
      <Download size={13} />
      {label}
    </button>
  );
}

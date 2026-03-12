'use client';

import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Loader2,
  Search,
  Shield,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuditTrail } from '@/hooks/useAuditTrail';

const ACTIONS = [
  'created',
  'updated',
  'deleted',
  'viewed',
  'logged_in',
  'logged_out',
];
const ENTITIES = ['ticket', 'article', 'user', 'profile', 'system'];

const ACTION_COLORS: Record<string, string> = {
  created: 'var(--app-health-healthy)',
  updated: 'var(--app-accent)',
  deleted: 'var(--app-priority-critical)',
  viewed: 'var(--app-text-muted)',
  logged_in: 'var(--app-stat-users)',
  logged_out: 'var(--app-text-faint)',
};

export default function AuditTrailPage() {
  const { entries, loading, totalCount, fetchEntries, exportAudit } =
    useAuditTrail();
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const pageSize = 50;

  const filters = useMemo(
    () => ({
      action: filterAction || undefined,
      entity: filterEntity || undefined,
      userId: undefined,
      email: filterEmail || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [filterAction, filterEntity, filterEmail, dateFrom, dateTo],
  );

  useEffect(() => {
    fetchEntries(filters, page, pageSize);
  }, [fetchEntries, filters, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const inputStyle: React.CSSProperties = {
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
    color: 'var(--app-text-primary)',
    borderRadius: '12px',
    outline: 'none',
    height: '36px',
    padding: '0 12px',
    fontSize: '13px',
  };

  return (
    <div className='min-h-screen' style={{ background: 'var(--app-bg)' }}>
      <div className='space-y-6 p-8'>
        {/* Header */}
        <div className='flex items-end justify-between'>
          <div className='flex items-center gap-3'>
            <div
              className='flex h-10 w-10 items-center justify-center rounded-md'
              style={{
                background: 'var(--app-accent-dim)',
                border: '1px solid var(--app-accent-border)',
              }}
            >
              <Shield size={18} style={{ color: 'var(--app-accent-text)' }} />
            </div>
            <div>
              <h1
                className='text-2xl font-bold tracking-tight'
                style={{ color: 'var(--app-text-primary)' }}
              >
                Audit Trail
              </h1>
              <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
                {totalCount.toLocaleString()} total events
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={() => exportAudit(filters)}
            className='flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90'
            style={{ background: 'var(--app-accent)', color: '#fff' }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className='glass-card overflow-hidden'>
          <div className='card-accent-line' />
          <div className='flex flex-wrap items-center gap-3 px-6 py-4'>
            <Filter size={13} style={{ color: 'var(--app-text-muted)' }} />
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(0);
              }}
              style={inputStyle}
            >
              <option value=''>All Actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <select
              value={filterEntity}
              onChange={(e) => {
                setFilterEntity(e.target.value);
                setPage(0);
              }}
              style={inputStyle}
            >
              <option value=''>All Entities</option>
              {ENTITIES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <div className='relative'>
              <Search
                size={12}
                className='absolute left-3 top-1/2 -translate-y-1/2'
                style={{ color: 'var(--app-text-faint)' }}
              />
              <input
                value={filterEmail}
                onChange={(e) => {
                  setFilterEmail(e.target.value);
                  setPage(0);
                }}
                placeholder='Filter by email...'
                className='w-48'
                style={{ ...inputStyle, paddingLeft: '32px' }}
              />
            </div>
            <input
              type='date'
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
              style={inputStyle}
              title='From date'
            />
            <input
              type='date'
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
              style={inputStyle}
              title='To date'
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className='flex justify-center py-16'>
            <Loader2
              size={20}
              className='animate-spin'
              style={{ color: 'var(--app-text-faint)' }}
            />
          </div>
        ) : (
          <div className='glass-card overflow-hidden'>
            <div className='card-accent-line' />
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--app-border)' }}>
                    {[
                      'Timestamp',
                      'User',
                      'Action',
                      'Entity',
                      'Description',
                    ].map((h) => (
                      <th
                        key={h}
                        className='px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider'
                        style={{ color: 'var(--app-text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: '1px solid var(--app-border)' }}
                    >
                      <td className='whitespace-nowrap px-5 py-3'>
                        <span
                          className='text-xs'
                          style={{ color: 'var(--app-text-muted)' }}
                        >
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td className='px-5 py-3'>
                        <span
                          className='text-xs font-semibold'
                          style={{ color: 'var(--app-text-secondary)' }}
                        >
                          {entry.user_email}
                        </span>
                      </td>
                      <td className='px-5 py-3'>
                        <span
                          className='rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase'
                          style={{
                            background: `color-mix(in srgb, ${ACTION_COLORS[entry.action] ?? 'var(--app-accent)'} 15%, transparent)`,
                            color:
                              ACTION_COLORS[entry.action] ??
                              'var(--app-accent)',
                          }}
                        >
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className='px-5 py-3'>
                        <span
                          className='text-xs capitalize'
                          style={{ color: 'var(--app-text-muted)' }}
                        >
                          {entry.entity}
                        </span>
                      </td>
                      <td className='max-w-xs truncate px-5 py-3'>
                        <span
                          className='text-xs'
                          style={{ color: 'var(--app-text-muted)' }}
                        >
                          {entry.description ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={5} className='py-12 text-center'>
                        <FileText
                          size={24}
                          className='mx-auto mb-2'
                          style={{ color: 'var(--app-text-faint)' }}
                        />
                        <p
                          className='text-sm'
                          style={{ color: 'var(--app-text-faint)' }}
                        >
                          No audit entries found
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-center gap-3'>
            <button
              type='button'
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className='flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-30'
              style={{
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-muted)',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span
              className='text-xs font-semibold'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Page {page + 1} of {totalPages}
            </span>
            <button
              type='button'
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className='flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-30'
              style={{
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-muted)',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

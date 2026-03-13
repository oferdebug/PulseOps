'use client';

import { Grip } from 'lucide-react';
import Link from 'next/link';
import { type DragEvent, useCallback, useState } from 'react';

type TicketStatus = 'open' | 'in_progress' | 'pending' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface TicketRow {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  created_at: string;
}

const COLUMNS: { key: TicketStatus; label: string; color: string }[] = [
  { key: 'open', label: 'Open', color: 'var(--app-status-open-text)' },
  {
    key: 'in_progress',
    label: 'In Progress',
    color: 'var(--app-status-progress-text)',
  },
  { key: 'pending', label: 'Pending', color: 'var(--app-status-pending-text)' },
  { key: 'closed', label: 'Closed', color: 'var(--app-status-closed-text)' },
];

const PRIORITY_DOT: Record<TicketPriority, string> = {
  low: 'dot-low',
  medium: 'dot-medium',
  high: 'dot-high',
  critical: 'dot-critical',
};

interface KanbanBoardProps {
  tickets: TicketRow[];
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

export function KanbanBoard({ tickets, onStatusChange }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TicketStatus | null>(null);

  const handleDragStart = useCallback((e: DragEvent, ticketId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticketId);
    setDraggedId(ticketId);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, col: TicketStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, col: TicketStatus) => {
      e.preventDefault();
      const ticketId = e.dataTransfer.getData('text/plain');
      if (ticketId) {
        const ticket = tickets.find((t) => t.id === ticketId);
        if (ticket && ticket.status !== col) {
          onStatusChange(ticketId, col);
        }
      }
      setDraggedId(null);
      setDragOverCol(null);
    },
    [tickets, onStatusChange],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverCol(null);
  }, []);

  return (
    <div className='grid grid-cols-4 gap-4'>
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.status === col.key);
        const isOver = dragOverCol === col.key;

        return (
          <section
            key={col.key}
            aria-label={`${col.label} column`}
            className='flex flex-col rounded-2xl transition-colors duration-200'
            style={{
              background: isOver
                ? 'var(--app-accent-dim)'
                : 'var(--app-surface)',
              border: `1px solid ${isOver ? 'var(--app-accent-border)' : 'var(--app-border)'}`,
              minHeight: '400px',
            }}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div
              className='flex items-center gap-2 px-4 py-3'
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <span
                className='h-2 w-2 rounded-full'
                style={{ background: col.color }}
              />
              <span
                className='text-xs font-bold uppercase tracking-wider'
                style={{ color: col.color }}
              >
                {col.label}
              </span>
              <span
                className='ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-bold'
                style={{
                  background: 'var(--app-surface-raised)',
                  color: 'var(--app-text-muted)',
                }}
              >
                {colTickets.length}
              </span>
            </div>

            {/* Cards */}
            <div className='flex-1 space-y-2 p-3 overflow-y-auto'>
              {colTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ticket.id)}
                  onDragEnd={handleDragEnd}
                  className='group block rounded-md p-3 transition-all duration-150 hover:-translate-y-0.5'
                  style={{
                    background: 'var(--app-surface-raised)',
                    border: '1px solid var(--app-border)',
                    opacity: draggedId === ticket.id ? 0.5 : 1,
                    cursor: 'grab',
                  }}
                >
                  <div className='flex items-start gap-2'>
                    <Grip
                      size={12}
                      className='mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-50'
                      style={{ color: 'var(--app-text-faint)' }}
                    />
                    <div className='min-w-0 flex-1'>
                      <p
                        className='truncate text-sm font-medium'
                        style={{ color: 'var(--app-text-primary)' }}
                      >
                        {ticket.title}
                      </p>
                      <div className='mt-2 flex items-center gap-2'>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[ticket.priority]}`}
                        />
                        <span
                          className='text-[10px] font-bold capitalize'
                          style={{ color: 'var(--app-text-muted)' }}
                        >
                          {ticket.priority}
                        </span>
                        <span
                          className='ml-auto font-mono text-[10px]'
                          style={{ color: 'var(--app-text-faint)' }}
                        >
                          {ticket.id.slice(0, 6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {colTickets.length === 0 && (
                <div
                  className='flex items-center justify-center py-8 text-xs'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  No tickets
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

'use client';

import { BookOpen, Brain, Loader2, Sparkles, Tag } from 'lucide-react';
import Link from 'next/link';
import { useAiAssist } from '@/hooks/useAiAssist';

export function AiTicketAssist({
  title,
  description,
  onApplyPriority,
  onApplyTags,
}: {
  title: string;
  description?: string;
  onApplyPriority?: (priority: string) => void;
  onApplyTags?: (tags: string[]) => void;
}) {
  const { classification, suggestions, loading, analyzeTicket } = useAiAssist();

  const canAnalyze = title.trim().length >= 5;

  return (
    <div className='space-y-3'>
      <button
        type='button'
        onClick={() => analyzeTicket(title, description)}
        disabled={!canAnalyze || loading}
        className='flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
        style={{
          background: 'var(--app-accent)',
          color: '#fff',
        }}
      >
        {loading ? (
          <Loader2 size={14} className='animate-spin' />
        ) : (
          <Sparkles size={14} />
        )}
        AI Assist
      </button>

      {classification && (
        <div
          className='space-y-3 rounded-md p-4'
          style={{
            background: 'var(--app-surface)',
            border: '1px solid var(--app-accent-border)',
          }}
        >
          <div className='flex items-center gap-2'>
            <Brain size={13} style={{ color: 'var(--app-accent-text)' }} />
            <span
              className='text-[11px] font-bold uppercase tracking-wider'
              style={{ color: 'var(--app-accent-text)' }}
            >
              AI Analysis
            </span>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <span
                className='text-[10px] font-bold uppercase'
                style={{ color: 'var(--app-text-faint)' }}
              >
                Priority
              </span>
              <div className='flex items-center gap-2 mt-1'>
                <span
                  className='rounded-lg px-2.5 py-1 text-xs font-bold capitalize'
                  style={{
                    background: 'var(--app-surface-raised)',
                    color: 'var(--app-text-primary)',
                  }}
                >
                  {classification.priority}
                </span>
                {onApplyPriority && (
                  <button
                    type='button'
                    onClick={() => onApplyPriority(classification.priority)}
                    className='text-[10px] font-semibold'
                    style={{ color: 'var(--app-accent-text)' }}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
            <div>
              <span
                className='text-[10px] font-bold uppercase'
                style={{ color: 'var(--app-text-faint)' }}
              >
                Category
              </span>
              <p
                className='mt-1 text-xs font-semibold capitalize'
                style={{ color: 'var(--app-text-primary)' }}
              >
                {classification.category}
              </p>
            </div>
          </div>

          {classification.tags.length > 0 && (
            <div>
              <div className='flex items-center gap-2'>
                <Tag size={11} style={{ color: 'var(--app-text-faint)' }} />
                <span
                  className='text-[10px] font-bold uppercase'
                  style={{ color: 'var(--app-text-faint)' }}
                >
                  Tags
                </span>
                {onApplyTags && (
                  <button
                    type='button'
                    onClick={() => onApplyTags(classification.tags)}
                    className='text-[10px] font-semibold'
                    style={{ color: 'var(--app-accent-text)' }}
                  >
                    Apply
                  </button>
                )}
              </div>
              <div className='mt-1 flex flex-wrap gap-1.5'>
                {classification.tags.map((tag) => (
                  <span
                    key={tag}
                    className='rounded-lg px-2 py-0.5 text-[10px] font-bold'
                    style={{
                      background: 'var(--app-accent-dim)',
                      color: 'var(--app-accent-text)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {classification.suggested_response && (
            <div
              className='rounded-lg p-3 text-xs'
              style={{
                background: 'var(--app-surface-raised)',
                color: 'var(--app-text-secondary)',
              }}
            >
              {classification.suggested_response}
            </div>
          )}
        </div>
      )}

      {suggestions.length > 0 && (
        <div
          className='space-y-2 rounded-md p-4'
          style={{
            background: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
          }}
        >
          <div className='flex items-center gap-2'>
            <BookOpen size={13} style={{ color: 'var(--app-text-muted)' }} />
            <span
              className='text-[11px] font-bold uppercase tracking-wider'
              style={{ color: 'var(--app-text-muted)' }}
            >
              Related KB Articles
            </span>
          </div>
          {suggestions.map((article) => (
            <Link
              key={article.id}
              href={`/knowledge-base/${article.id}`}
              target='_blank'
              className='flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-[var(--app-surface-raised)]'
            >
              <span
                className='text-xs font-medium'
                style={{ color: 'var(--app-text-secondary)' }}
              >
                {article.title}
              </span>
              <span
                className='ml-auto text-[10px] capitalize'
                style={{ color: 'var(--app-text-faint)' }}
              >
                {article.category}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

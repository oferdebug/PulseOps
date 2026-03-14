'use client';

import {
  Activity,
  BookOpen,
  LayoutDashboard,
  Loader2,
  Plus,
  Search,
  Settings,
  Ticket,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ArticleResult, TicketResult } from '@/hooks/useSearch';
import { useSearch } from '@/hooks/useSearch';

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-open',
  in_progress: 'badge-progress',
  pending: 'badge-pending',
  closed: 'badge-closed',
};

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

type ResultItem =
  | { type: 'ticket'; route: string; data: TicketResult }
  | { type: 'article'; route: string; data: ArticleResult }
  | { type: 'action'; route: string; label: string; icon: React.ElementType };

// ── Quick Actions ──
const QUICK_ACTIONS: { label: string; route: string; icon: React.ElementType; keywords: string }[] = [
  { label: 'Create new ticket', route: '/tickets/new', icon: Plus, keywords: 'new ticket create' },
  { label: 'Write new article', route: '/knowledge-base/new', icon: Plus, keywords: 'new article write kb' },
  { label: 'Go to Dashboard', route: '/dashboard', icon: LayoutDashboard, keywords: 'dashboard home' },
  { label: 'Go to Tickets', route: '/tickets', icon: Ticket, keywords: 'tickets list' },
  { label: 'Go to Knowledge Base', route: '/knowledge-base', icon: BookOpen, keywords: 'knowledge base articles' },
  { label: 'Go to Users', route: '/users', icon: Users, keywords: 'users people' },
  { label: 'Go to Activity Logs', route: '/activity-logs', icon: Activity, keywords: 'activity logs audit' },
  { label: 'Go to Settings', route: '/settings', icon: Settings, keywords: 'settings preferences' },
];

const RECENT_SEARCHES_KEY = 'pulseops_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function addRecentSearch(q: string) {
  const trimmed = q.trim();
  if (!trimmed || trimmed.length < 2) return;
  const recent = getRecentSearches().filter((s) => s !== trimmed);
  recent.unshift(trimmed);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { results, loading } = useSearch(query);

  const showingDefaultView = query.trim().length < 2;

  // Filter quick actions by query
  const matchedActions = useMemo(() => {
    if (showingDefaultView) return QUICK_ACTIONS;
    const q = query.toLowerCase();
    return QUICK_ACTIONS.filter(
      (a) => a.label.toLowerCase().includes(q) || a.keywords.includes(q),
    );
  }, [query, showingDefaultView]);

  const flatItems: ResultItem[] = useMemo(() => {
    const items: ResultItem[] = [];
    if (!showingDefaultView) {
      results.tickets.forEach((t) => {
        items.push({ type: 'ticket', route: `/tickets/${t.id}`, data: t });
      });
      results.articles.forEach((a) => {
        items.push({ type: 'article', route: `/knowledge-base/${a.id}`, data: a });
      });
    }
    matchedActions.forEach((a) => {
      items.push({ type: 'action', route: a.route, label: a.label, icon: a.icon });
    });
    return items;
  }, [results.tickets, results.articles, matchedActions, showingDefaultView]);

  const totalCount = flatItems.length;
  const hasResults = totalCount > 0;
  const isEmpty = query.trim().length >= 2 && !loading && !hasResults;

  const goTo = useCallback(
    (item: ResultItem) => {
      if (item.type !== 'action' && query.trim().length >= 2) {
        addRecentSearch(query);
      }
      router.push(item.route);
      onClose();
      setQuery('');
      setHighlightIndex(0);
    },
    [router, onClose, query],
  );

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHighlightIndex(0);
    setRecentSearches(getRecentSearches());
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setHighlightIndex((i) => (i < totalCount ? i : Math.max(0, totalCount - 1)));
  }, [totalCount]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((i) => (i + 1) % Math.max(1, totalCount));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) =>
          i <= 0 ? Math.max(0, totalCount - 1) : i - 1,
        );
        return;
      }
      if (e.key === 'Enter' && flatItems[highlightIndex]) {
        e.preventDefault();
        goTo(flatItems[highlightIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, totalCount, highlightIndex, flatItems, onClose, goTo]);

  if (!open) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape handled by window-level keydown listener
    <div
      className='fixed inset-0 z-50 flex items-start justify-center pt-[15vh] backdrop-blur-md'
      style={{ background: 'var(--app-surface-overlay)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role='dialog'
      aria-modal='true'
      aria-label='Command palette'
    >
      <div className='glass-card w-full max-w-[600px] overflow-hidden'>
        <div className='card-accent-line' />

        <div
          className='p-4'
          style={{ borderBottom: '1px solid var(--app-border)' }}
        >
          <div
            className='flex items-center gap-3 rounded-md px-4 py-2.5'
            style={{
              background: 'var(--app-surface-raised)',
              border: '1px solid var(--app-border)',
            }}
          >
            <Search size={18} style={{ color: 'var(--app-text-muted)' }} />
            <input
              ref={inputRef}
              type='text'
              placeholder='Search or type a command…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='flex-1 bg-transparent text-sm outline-none placeholder:opacity-60'
              style={{ color: 'var(--app-text-primary)' }}
              autoComplete='off'
              aria-autocomplete='list'
              aria-controls='search-results-listbox'
              aria-activedescendant={
                hasResults && flatItems[highlightIndex]
                  ? `search-result-${highlightIndex}`
                  : undefined
              }
            />
            {loading && (
              <Loader2
                size={18}
                className='animate-spin'
                style={{ color: 'var(--app-text-muted)' }}
              />
            )}
            <kbd
              className='hidden sm:inline-block rounded px-1.5 py-0.5 text-[10px] font-medium'
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-text-faint)',
              }}
            >
              ESC
            </kbd>
          </div>
        </div>

        <div id='search-results' className='max-h-[60vh] overflow-y-auto p-4'>
          {/* ── Default view: Recent searches + Quick actions ── */}
          {showingDefaultView && (
            <div className='space-y-4'>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className='mb-2 flex items-center justify-between px-1'>
                    <span
                      className='text-[11px] font-bold uppercase tracking-wider'
                      style={{ color: 'var(--app-text-muted)' }}
                    >
                      Recent Searches
                    </span>
                    <button
                      type='button'
                      onClick={() => {
                        clearRecentSearches();
                        setRecentSearches([]);
                      }}
                      className='text-[10px] font-semibold transition-opacity hover:opacity-70'
                      style={{ color: 'var(--app-text-muted)' }}
                    >
                      Clear
                    </button>
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        type='button'
                        onClick={() => setQuery(s)}
                        className='flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors'
                        style={{
                          background: 'var(--app-surface-raised)',
                          border: '1px solid var(--app-border)',
                          color: 'var(--app-text-secondary)',
                        }}
                      >
                        <Search size={10} />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <span
                  className='mb-2 block px-1 text-[11px] font-bold uppercase tracking-wider'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Quick Actions
                </span>
                {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: Custom accessible listbox widget for combobox pattern */}
                <ul
                  className='space-y-0.5 list-none p-0 m-0'
                  role='listbox'
                  id='search-results-listbox'
                >
                  {matchedActions.map((action) => {
                    const Icon = action.icon;
                    const flatIdx = flatItems.findIndex(
                      (it) => it.type === 'action' && it.route === action.route,
                    );
                    const isHighlight = flatIdx === highlightIndex;
                    return (
                      <li key={action.route}>
                        <button
                          id={
                            isHighlight ? `search-result-${flatIdx}` : undefined
                          }
                          type='button'
                          role='option'
                          tabIndex={isHighlight ? 0 : -1}
                          aria-selected={isHighlight}
                          className='flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors'
                          style={{
                            background: isHighlight
                              ? 'var(--app-surface-raised)'
                              : 'transparent',
                            border: isHighlight
                              ? '1px solid var(--app-border)'
                              : '1px solid transparent',
                          }}
                          onClick={() =>
                            goTo({
                              type: 'action',
                              route: action.route,
                              label: action.label,
                              icon: Icon,
                            })
                          }
                          onMouseEnter={() => setHighlightIndex(flatIdx)}
                        >
                          <div
                            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'
                            style={{
                              background:
                                action.label.startsWith('Create') ||
                                action.label.startsWith('Write')
                                  ? 'color-mix(in srgb, var(--app-accent) 15%, transparent)'
                                  : 'var(--app-surface-raised)',
                              border: '1px solid var(--app-border)',
                            }}
                          >
                            <Icon
                              size={14}
                              style={{
                                color:
                                  action.label.startsWith('Create') ||
                                  action.label.startsWith('Write')
                                    ? 'var(--app-accent-text)'
                                    : 'var(--app-text-muted)',
                              }}
                            />
                          </div>
                          <span
                            className='text-sm font-medium'
                            style={{ color: 'var(--app-text-primary)' }}
                          >
                            {action.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Hint */}
              <p
                className='px-1 text-[11px]'
                style={{ color: 'var(--app-text-faint)' }}
              >
                Type to search tickets &amp; articles, or select a quick action
                ↑↓
              </p>
            </div>
          )}
          {/* ── Search results ── */}
          {!showingDefaultView && loading && !hasResults && (
            <div
              className='flex items-center justify-center gap-2 py-8 text-sm'
              style={{ color: 'var(--app-text-muted)' }}
            >
              <Loader2 size={16} className='animate-spin' />
              Searching…
            </div>
          )}
          {!showingDefaultView && !loading && isEmpty && (
            <p
              className='py-8 text-center text-sm'
              style={{ color: 'var(--app-text-muted)' }}
            >
              No results for &quot;{query.trim()}&quot;
            </p>
          )}
          {!showingDefaultView && hasResults && (
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: Custom accessible listbox widget for search results
            <div
              className='space-y-4'
              role='listbox'
              id='search-results-listbox'
              aria-label='Search results'
            >
              {results.tickets.length > 0 && (
                <fieldset className='border-0 p-0 m-0 min-w-0'>
                  <legend
                    className='mb-2 px-1 text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Tickets
                  </legend>
                  <ul className='space-y-0.5 list-none p-0 m-0'>
                    {results.tickets.map((ticket) => {
                      const flatIdx = flatItems.findIndex(
                        (it) =>
                          it.type === 'ticket' && it.data.id === ticket.id,
                      );
                      const isHighlight = flatIdx === highlightIndex;
                      const badgeClass =
                        STATUS_BADGE[ticket.status] ?? 'badge-pending';
                      return (
                        <li key={ticket.id}>
                          <button
                            id={
                              isHighlight
                                ? `search-result-${flatIdx}`
                                : undefined
                            }
                            type='button'
                            role='option'
                            tabIndex={isHighlight ? 0 : -1}
                            aria-selected={isHighlight}
                            className='flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors'
                            style={{
                              background: isHighlight
                                ? 'var(--app-surface-raised)'
                                : 'transparent',
                              border: isHighlight
                                ? '1px solid var(--app-border)'
                                : '1px solid transparent',
                            }}
                            onClick={() =>
                              goTo({
                                type: 'ticket',
                                route: `/tickets/${ticket.id}`,
                                data: ticket,
                              })
                            }
                            onMouseEnter={() => setHighlightIndex(flatIdx)}
                          >
                            <div
                              className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'
                              style={{
                                background: 'var(--app-accent-dim)',
                                color: 'var(--app-accent-text)',
                              }}
                            >
                              <Ticket size={14} />
                            </div>
                            <span
                              className='min-w-0 flex-1 truncate text-sm font-medium'
                              style={{ color: 'var(--app-text-primary)' }}
                            >
                              {ticket.title}
                            </span>
                            <span
                              className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize ${badgeClass}`}
                            >
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              )}

              {results.articles.length > 0 && (
                <fieldset className='border-0 p-0 m-0 min-w-0'>
                  <legend
                    className='mb-2 px-1 text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Knowledge Base
                  </legend>
                  <ul className='space-y-0.5 list-none p-0 m-0'>
                    {results.articles.map((article) => {
                      const flatIdx = flatItems.findIndex(
                        (it) =>
                          it.type === 'article' && it.data.id === article.id,
                      );
                      const isHighlight = flatIdx === highlightIndex;
                      const categoryLabel =
                        article.category === 'active-directory'
                          ? 'Active Directory'
                          : article.category.charAt(0).toUpperCase() +
                            article.category.slice(1);
                      return (
                        <li key={article.id}>
                          <button
                            id={
                              isHighlight
                                ? `search-result-${flatIdx}`
                                : undefined
                            }
                            type='button'
                            role='option'
                            tabIndex={isHighlight ? 0 : -1}
                            aria-selected={isHighlight}
                            className='flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors'
                            style={{
                              background: isHighlight
                                ? 'var(--app-surface-raised)'
                                : 'transparent',
                              border: isHighlight
                                ? '1px solid var(--app-border)'
                                : '1px solid transparent',
                            }}
                            onClick={() =>
                              goTo({
                                type: 'article',
                                route: `/knowledge-base/${article.id}`,
                                data: article,
                              })
                            }
                            onMouseEnter={() => setHighlightIndex(flatIdx)}
                          >
                            <div
                              className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'
                              style={{
                                background: 'var(--app-accent-dim)',
                                color: 'var(--app-accent-text)',
                              }}
                            >
                              <BookOpen size={14} />
                            </div>
                            <span
                              className='min-w-0 flex-1 truncate text-sm font-medium'
                              style={{ color: 'var(--app-text-primary)' }}
                            >
                              {article.title}
                            </span>
                            <span
                              className='shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize'
                              style={{
                                background: 'var(--app-surface-raised)',
                                color: 'var(--app-text-secondary)',
                                border: '1px solid var(--app-border)',
                              }}
                            >
                              {categoryLabel}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              )}

              {/* Quick actions in search results */}
              {matchedActions.length > 0 && (
                <fieldset className='border-0 p-0 m-0 min-w-0'>
                  <legend
                    className='mb-2 px-1 text-[11px] font-bold uppercase tracking-wider'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Actions
                  </legend>
                  <ul className='space-y-0.5 list-none p-0 m-0'>
                    {matchedActions.map((action) => {
                      const Icon = action.icon;
                      const flatIdx = flatItems.findIndex(
                        (it) =>
                          it.type === 'action' && it.route === action.route,
                      );
                      const isHighlight = flatIdx === highlightIndex;
                      return (
                        <li key={action.route}>
                          <button
                            id={
                              isHighlight
                                ? `search-result-${flatIdx}`
                                : undefined
                            }
                            type='button'
                            role='option'
                            tabIndex={isHighlight ? 0 : -1}
                            aria-selected={isHighlight}
                            className='flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors'
                            style={{
                              background: isHighlight
                                ? 'var(--app-surface-raised)'
                                : 'transparent',
                              border: isHighlight
                                ? '1px solid var(--app-border)'
                                : '1px solid transparent',
                            }}
                            onClick={() =>
                              goTo({
                                type: 'action',
                                route: action.route,
                                label: action.label,
                                icon: Icon,
                              })
                            }
                            onMouseEnter={() => setHighlightIndex(flatIdx)}
                          >
                            <div
                              className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'
                              style={{
                                background: 'var(--app-surface-raised)',
                                border: '1px solid var(--app-border)',
                              }}
                            >
                              <Icon
                                size={14}
                                style={{ color: 'var(--app-text-muted)' }}
                              />
                            </div>
                            <span
                              className='text-sm font-medium'
                              style={{ color: 'var(--app-text-secondary)' }}
                            >
                              {action.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

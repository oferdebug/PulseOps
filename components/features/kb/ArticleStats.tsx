'use client';

import { Eye, Star } from 'lucide-react';
import { useArticleAnalytics } from '@/hooks/useArticleAnalytics';

interface ArticleStatsProps {
  articleId: string;
  userId?: string;
}

export function ArticleStats({ articleId, userId }: ArticleStatsProps) {
  const { stats, rateArticle } = useArticleAnalytics(articleId, userId);

  return (
    <div className='flex flex-wrap items-center gap-4'>
      {/* Views */}
      <div
        className='flex items-center gap-1.5'
        style={{ color: 'var(--app-text-muted)' }}
      >
        <Eye size={13} />
        <span className='text-xs font-semibold'>
          {stats.viewCount} view{stats.viewCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Average rating */}
      <div
        className='flex items-center gap-1.5'
        style={{ color: 'var(--app-text-muted)' }}
      >
        <Star size={13} style={{ color: '#fbbf24' }} />
        <span className='text-xs font-semibold'>
          {stats.ratingCount > 0
            ? `${stats.avgRating} (${stats.ratingCount})`
            : 'No ratings'}
        </span>
      </div>

      {/* User rating */}
      {userId && (
        <div className='flex items-center gap-0.5'>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type='button'
              onClick={() => rateArticle(star)}
              className='p-0.5 transition-transform hover:scale-125'
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                size={14}
                fill={
                  stats.userRating && star <= stats.userRating
                    ? '#fbbf24'
                    : 'none'
                }
                style={{
                  color:
                    stats.userRating && star <= stats.userRating
                      ? '#fbbf24'
                      : 'var(--app-text-faint)',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

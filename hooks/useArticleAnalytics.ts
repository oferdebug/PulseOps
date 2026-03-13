'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ArticleStats {
  viewCount: number;
  avgRating: number;
  ratingCount: number;
  userRating: number | null;
}

export function useArticleAnalytics(articleId: string, userId?: string) {
  const [stats, setStats] = useState<ArticleStats>({
    viewCount: 0,
    avgRating: 0,
    ratingCount: 0,
    userRating: null,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const [viewsRes, ratingsRes, userRatingRes] = await Promise.all([
        supabase
          .from('article_views')
          .select('id', { count: 'exact', head: true })
          .eq('article_id', articleId),
        supabase
          .from('article_ratings')
          .select('rating')
          .eq('article_id', articleId),
        userId
          ? supabase
              .from('article_ratings')
              .select('rating')
              .eq('article_id', articleId)
              .eq('user_id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (viewsRes.error)
        console.error('Failed to fetch views:', viewsRes.error);
      if (ratingsRes.error)
        console.error('Failed to fetch ratings:', ratingsRes.error);
      if (userRatingRes.error)
        console.error('Failed to fetch user rating:', userRatingRes.error);

      const ratings = ratingsRes.data ?? [];
      const avg =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

      setStats({
        viewCount: viewsRes.count ?? 0,
        avgRating: Math.round(avg * 10) / 10,
        ratingCount: ratings.length,
        userRating: userRatingRes.data?.rating ?? null,
      });
    } catch (err) {
      console.error('Failed to fetch article stats:', err);
    } finally {
      setLoading(false);
    }
  }, [articleId, userId]);

  const recordView = useCallback(async () => {
    const supabase = createClient();
    await supabase
      .from('article_views')
      .insert({ article_id: articleId, user_id: userId ?? null });
  }, [articleId, userId]);

  const rateArticle = useCallback(
    async (rating: number) => {
      if (!userId) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('article_ratings')
        .upsert(
          { article_id: articleId, user_id: userId, rating },
          { onConflict: 'article_id,user_id' },
        );
      if (!error) {
        setStats((prev) => ({ ...prev, userRating: rating }));
        fetchStats();
      }
    },
    [articleId, userId, fetchStats],
  );

  useEffect(() => {
    if (articleId) fetchStats();
  }, [articleId, fetchStats]);

  return { stats, loading, recordView, rateArticle, refresh: fetchStats };
}

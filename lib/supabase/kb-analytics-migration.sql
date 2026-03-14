-- Knowledge Base Analytics Migration
-- Tracks article views and ratings

-- Article views table
CREATE TABLE IF NOT EXISTS article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Article ratings table
CREATE TABLE IF NOT EXISTS article_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_created_at ON article_views(created_at);
CREATE INDEX IF NOT EXISTS idx_article_ratings_article_id ON article_ratings(article_id);
CREATE INDEX IF NOT EXISTS idx_article_ratings_user_id ON article_ratings(user_id);

-- Enable RLS
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_ratings ENABLE ROW LEVEL SECURITY;

-- Views: anyone authenticated can read and insert
DROP POLICY IF EXISTS "Authenticated users can view article_views" ON article_views;
CREATE POLICY "Authenticated users can view article_views"
  ON article_views FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert article_views" ON article_views;
CREATE POLICY "Authenticated users can insert article_views"
  ON article_views FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Ratings: anyone authenticated can read, insert, and update their own
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON article_ratings;
CREATE POLICY "Authenticated users can view ratings"
  ON article_ratings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert ratings" ON article_ratings;
CREATE POLICY "Authenticated users can insert ratings"
  ON article_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ratings" ON article_ratings;
CREATE POLICY "Users can update own ratings"
  ON article_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own ratings" ON article_ratings;
CREATE POLICY "Users can delete own ratings"
  ON article_ratings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

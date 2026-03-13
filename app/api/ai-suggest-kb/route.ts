import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    );

    // Fetch published articles
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, category')
      .eq('status', 'published')
      .limit(100);

    if (!articles || articles.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Simple keyword matching for suggestions
    const query = `${title} ${description ?? ''}`.toLowerCase();
    const words = query.split(/\s+/).filter((w) => w.length > 3);

    const scored = articles.map((article) => {
      const articleText = article.title.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (articleText.includes(word)) score += 2;
      }
      if (article.category) {
        const escapedCategory = article.category
          .toLowerCase()
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const categoryRegex = new RegExp(`\\b${escapedCategory}\\b`, 'i');
        if (categoryRegex.test(query)) {
          score += 3;
        }
      }
      return { ...article, score };
    });
    

    const suggestions = scored
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ id, title: t, category }) => ({ id, title: t, category }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI suggest KB error:', error);
    return NextResponse.json({ error: 'Suggestion failed' }, { status: 500 });
  }
}

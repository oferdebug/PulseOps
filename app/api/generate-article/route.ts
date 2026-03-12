import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/api-auth';

const MAX_TITLE_LENGTH = 500;

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { title } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 },
      );
    }

    const sanitizedTitle = title.slice(0, MAX_TITLE_LENGTH);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are an IT helpdesk knowledge base writer.
Write a clear, practical knowledge base article for IT support staff about: "${sanitizedTitle}".

Format it in Markdown with:
- A brief intro (1-2 sentences)
- ## Symptoms or Overview section
- ## Solution / Steps section (numbered steps)
- ## Notes or Tips section (if relevant)

Keep it concise, professional, and actionable. No fluff.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('generate-article error:', error);
    return NextResponse.json({ content: '' }, { status: 500 });
  }
}

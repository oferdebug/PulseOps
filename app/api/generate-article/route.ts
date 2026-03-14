import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  try {
    const { title: rawTitle } = await req.json();

    if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const title = rawTitle.trim();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI generation not configured' },
        { status: 503 },
      );
    }

    timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are an IT helpdesk knowledge base writer. 
Write a clear, practical knowledge base article for IT support staff about: "${title}".

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

    if (!response.ok) {
      clearTimeout(timeoutId);
      let upstreamBody: string;
      try {
        upstreamBody = await response.text();
      } catch {
        upstreamBody = '(unreadable)';
      }
      console.error(
        `Anthropic API error: status=${response.status} body=${upstreamBody}`,
      );
      return NextResponse.json(
        { error: 'Upstream service error' },
        { status: 502 },
      );
    }

    clearTimeout(timeoutId);
    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    return NextResponse.json({ content: text });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || controller.signal.aborted)
    ) {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
    }
    console.error('generate-article error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

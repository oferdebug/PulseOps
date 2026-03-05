import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
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

    const data = await response.json();
    console.log('Anthropic response:', JSON.stringify(data, null, 2));
    const text = data.content?.[0]?.text ?? '';
    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('generate-article error:', error);
    return NextResponse.json({ content: '' }, { status: 500 });
  }
}

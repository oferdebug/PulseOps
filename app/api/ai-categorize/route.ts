import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/api-auth';

const MAX_TITLE_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 5000;

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { title, description } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const sanitizedTitle = title.slice(0, MAX_TITLE_LENGTH);
    const sanitizedDescription = typeof description === 'string'
      ? description.slice(0, MAX_DESCRIPTION_LENGTH)
      : '';

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: simple keyword-based categorization
      return NextResponse.json(fallbackCategorize(sanitizedTitle, sanitizedDescription));
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are an IT helpdesk ticket classifier. Given a ticket title and description, return a JSON object with:
- "priority": one of "low", "medium", "high", "critical"
- "category": one of "networking", "hardware", "software", "security", "active-directory", "email", "general"
- "suggested_response": a brief 1-2 sentence initial response to the user
- "tags": array of 1-3 relevant tags

Ticket Title: ${sanitizedTitle}
${sanitizedDescription ? `Description: ${sanitizedDescription}` : ''}

Return ONLY valid JSON, no other text.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '{}';

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(fallbackCategorize(sanitizedTitle, sanitizedDescription));
    }
  } catch (error) {
    console.error('AI categorize error:', error);
    return NextResponse.json(
      { error: 'Classification failed' },
      { status: 500 },
    );
  }
}

function fallbackCategorize(title: string, description?: string) {
  const text = `${title} ${description ?? ''}`.toLowerCase();

  let category = 'general';
  let priority = 'medium';
  const tags: string[] = [];

  if (text.match(/vpn|network|dns|firewall|connection|wifi|internet/)) {
    category = 'networking';
    tags.push('networking');
  } else if (text.match(/password|login|mfa|2fa|auth|access|permission/)) {
    category = 'security';
    tags.push('security');
  } else if (text.match(/active.?directory|ad|ldap|group.?policy|gpo/)) {
    category = 'active-directory';
    tags.push('active-directory');
  } else if (text.match(/email|outlook|exchange|smtp|mailbox/)) {
    category = 'email';
    tags.push('email');
  } else if (
    text.match(/hardware|printer|monitor|laptop|desktop|keyboard|mouse/)
  ) {
    category = 'hardware';
    tags.push('hardware');
  } else if (text.match(/software|install|update|license|app|application/)) {
    category = 'software';
    tags.push('software');
  }

  if (text.match(/urgent|critical|down|outage|emergency|broken|crash/)) {
    priority = 'critical';
  } else if (text.match(/important|asap|high|cannot|can't|unable/)) {
    priority = 'high';
  } else if (text.match(/minor|low|cosmetic|nice.?to.?have|when.?possible/)) {
    priority = 'low';
  }

  return {
    priority,
    category,
    suggested_response: `Thank you for submitting your ${category} request. Our team will review it shortly.`,
    tags,
  };
}

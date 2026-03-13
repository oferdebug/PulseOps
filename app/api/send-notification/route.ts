import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      );
    }

    // Verify the caller is authenticated
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, type, title, message, ticketId, ticketTitle } =
      await req.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Get user email from profile

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 },
      );
    }

    // Check user preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const prefMap: Record<string, string> = {
      created: 'ticket_created',
      updated: 'ticket_updated',
      closed: 'ticket_closed',
      assigned: 'ticket_assigned',
      comment: 'ticket_commented',
      sla_breach: 'sla_breach',
      mention: 'mention',
    };

    const prefKey = prefMap[type];
    if (prefs && prefKey && prefs[prefKey] === false) {
      return NextResponse.json({ skipped: true, reason: 'User opted out' });
    }

    const ticketUrl = ticketId
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/tickets/${ticketId}`
      : null;

    if (!resend) {
      return NextResponse.json({ success: true, email: false });
    }

    const { error } = await resend.emails.send({
      from: 'PulseOps <notifications@pulseops.app>',
      to: [profile.email],
      subject: `[PulseOps] ${title}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
          <div style="background: #0a0a0f; border-radius: 16px; overflow: hidden; border: 1px solid #1e1e2e;">
            <div style="height: 3px; background: linear-gradient(90deg, #10b981, #059669);"></div>
            <div style="padding: 32px;">
              <h1 style="color: #e2e8f0; font-size: 18px; font-weight: 800; margin: 0 0 8px;">
                ${escapeHtml(title)}
              </h1>
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px;">
                ${escapeHtml(message ?? '')}
              </p>
              ${
                ticketTitle
                  ? `<div style="background: #111118; border-radius: 12px; padding: 16px; border: 1px solid #1e1e2e; margin-bottom: 24px;">
                  <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px;">Ticket</p>
                  <p style="color: #e2e8f0; font-size: 14px; font-weight: 600; margin: 0;">${escapeHtml(ticketTitle)}</p>
                </div>`
                  : ''
              }
              ${
                ticketUrl
                  ? `<a href="${ticketUrl}" style="display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 13px; font-weight: 700;">View Ticket</a>`
                  : ''
              }
            </div>
            <div style="padding: 16px 32px; border-top: 1px solid #1e1e2e;">
              <p style="color: #475569; font-size: 11px; margin: 0;">PulseOps — IT Operations Platform</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('Email notification error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

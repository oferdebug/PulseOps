import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // Verify the caller is an authenticated admin
  const serverSupabase = await createServerClient();
  const {
    data: { user: caller },
  } = await serverSupabase.auth.getUser();
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: callerProfile } = await serverSupabase
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single();
  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Malformed JSON in request body' },
      { status: 400 },
    );
  }
  const { email, fullName, role, department, phone } = body as {
    email: string;
    fullName: string;
    role: string;
    department?: string;
    phone?: string;
  };

  if (!email?.trim() || !fullName?.trim()) {
    return NextResponse.json(
      { error: 'Name and email are required' },
      { status: 400 },
    );
  }

  const VALID_ROLES = ['admin', 'agent', 'customer'] as const;
  if (role && !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return NextResponse.json(
      { error: `Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    );
  }

  // Use the service role key for admin operations
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Create auth user
  const { data: authData, error: authErr } =
    await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    });
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 400 });
  }
  if (!authData.user) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 },
    );
  }
  const userId = authData.user.id;

  // Insert profile linked to the auth user
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      full_name: fullName.trim(),
      email: email.trim(),
      role: role || 'customer',
      department: department?.trim() || null,
      phone: phone?.trim() || null,
    })
    .select('id')
    .single();

  if (profileErr) {
    // Rollback: delete the auth user we just created
    try {
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (rollbackError) {
        console.error(
          `Failed to rollback auth user ${userId} after profile insert failure:`,
          rollbackError.message,
        );
      }
    } catch (rollbackErr) {
      console.error(
        `Unexpected error rolling back auth user ${userId}:`,
        rollbackErr,
      );
    }
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }

  return NextResponse.json({ id: profile.id });
}

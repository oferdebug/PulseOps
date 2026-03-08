const SUPABASE_URL_KEY = 'NEXT_PUBLIC_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
const SUPABASE_PUBLISHABLE_KEY = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY';

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    throw new Error(
      `Missing Supabase environment variables. Set ${SUPABASE_URL_KEY} and one of ${SUPABASE_ANON_KEY} or ${SUPABASE_PUBLISHABLE_KEY}.`,
    );
  }

  return { url, key };
}

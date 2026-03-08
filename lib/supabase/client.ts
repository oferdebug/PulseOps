import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const createClient = () => {
  const { url, key } = getSupabasePublicEnv();

  return createBrowserClient(url, key);
};

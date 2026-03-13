/**
 * useActivityLogger
 *
 * Returns a `log()` function that inserts a row into activity_logs.
 * Call it after any meaningful action (create, update, delete).
 *
 * Example:
 *   const { log } = useActivityLogger()
 *   await log({ action: 'created', entity: 'ticket', description: 'Created ticket: VPN issue' })
 */

import { createClient } from '@/lib/supabase/client';
export type LogParams = {
  action:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'viewed'
    | 'logged_in'
    | 'logged_out';
  entity: 'ticket' | 'article' | 'user' | 'profile' | 'system';
  description: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
};

export function useActivityLogger() {
  async function log(params: LogParams) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        action: params.action,
        entity: params.entity,
        entity_id: params.entity_id ?? null,
        description: params.description,
        metadata: params.metadata ?? null,
      });
    } catch {
      console.warn('Failed to log activity');
    }
  }

  return { log };
}

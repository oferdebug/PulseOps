import {useEffect, useState} from "react";
import {createClient} from "@/lib/supabase/client";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string | null;
}


export function useCurrentUser() {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loading,setLoading]=useState(true);
    const [error, setError] = useState<Error | null>(null);


    useEffect(()=>{
        const supabase = createClient();

        async function loadProfile(authUser: {
          id: string;
          email?: string | null;
          user_metadata?: Record<string, unknown>;
        }) {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', authUser.id)
            .single();
          if (profileErr) {
            console.error('Failed to load profile:', profileErr);
            setError(profileErr);
          } else {
            setError(null);
          }
          setUser({
            id: authUser.id,
            email: authUser.email ?? '',
            fullName:
              (authUser.user_metadata?.full_name as string) ??
              authUser.email ??
              '',
            organizationId: profile?.organization_id ?? null,
          });
        }

        supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (user) {
            await loadProfile(user);
          }
          setLoading(false);
        });

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            loadProfile(session.user);
          } else {
            setUser(null);
            setLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
    },[])
   return { user, loading, error };
} 
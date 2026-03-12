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


    useEffect(()=>{
        const supabase=createClient();
        supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('organization_id')
              .eq('id', user.id)
              .single();
            setUser({
              id: user.id,
              email: user.email ?? '',
              fullName: user.user_metadata?.full_name ?? user.email ?? '',
              organizationId: profile?.organization_id ?? null,
            });
          }
          setLoading(false);
        });
    },[])
   return {user, loading};
} 
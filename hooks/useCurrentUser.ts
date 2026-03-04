import {useEffect, useState} from "react";
import {createClient} from "@/lib/supabase/client";

interface UseCurrentUser {
    id:string;
    email:string;
    fullName:string;
}


export function useCurrentUser() {
    const [user,setUser]=useState<UseCurrentUser|null>(null);
    const [loading,setLoading]=useState(true);


    useEffect(()=>{
        const supabase=createClient();
        supabase.auth.getUser().then(({data:{user}})=>{
            if (user) {
                setUser({
                    id:user.id ,
                    email:user.email??'',
                    fullName:user.user_metadata?.full_name??user.email??'',
                })
            }
            setLoading(false);
        })
    },[])
   return {user, loading};
} 
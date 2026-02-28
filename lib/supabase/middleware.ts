import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";


const supabaseMiddleware=process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export default async function middleware(request:NextRequest) {
    const response=NextResponse.next();
    const supabase=createServerClient(supabaseMiddleware, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({name,value,options})=>{
                    const sameSite = options.sameSite;
                    const normalizedSameSite =
                        sameSite === "lax" ||
                        sameSite === "strict" ||
                        sameSite === "none" ||
                        typeof sameSite === "boolean"
                            ? sameSite
                            : undefined;

                    response.cookies.set(name,value,{
                        ...options,
                        sameSite: normalizedSameSite,
                    });
                });
            },
        },
    })
}
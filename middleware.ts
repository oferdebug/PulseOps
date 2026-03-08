import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  let supabaseUrl: string;
  let supabaseKey: string;

  try {
    const env = getSupabasePublicEnv();
    supabaseUrl = env.url;
    supabaseKey = env.key;
  } catch (error) {
    console.error(
      "Missing Supabase environment variables in middleware:",
      error,
    );
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: Parameters<typeof response.cookies.set>[2];
        }[],
      ) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/Login") ||
    request.nextUrl.pathname.startsWith("/Register");

  /* If User Is Not Connected And Try To Get To protcted Dashboard */
  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/Login", request.url));
  }
  /* If User Is Connectec And Try To Get To Dashboard */
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

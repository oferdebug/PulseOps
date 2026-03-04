import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail early with a clear message if env vars are missing
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables in middleware");
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
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

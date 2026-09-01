import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

// Server-side reads need the service-role key (see createServiceClient below)
// since there's no Clerk session yet to scope an RLS-respecting query to.
export const isSupabaseServiceConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Server-side Supabase client scoped to the signed-in Clerk user. RLS
 * policies read the Clerk user id from the JWT's `sub` claim, so the Clerk
 * session token must be forwarded as the Supabase access token (configure
 * Supabase's third-party auth integration to accept Clerk's JWKS).
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
}

/**
 * Service-role client for background jobs (prompt runner, scoring, alerts).
 * Bypasses RLS — never expose to the browser, never use inside a request
 * handler that renders user input directly from it without an org check.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

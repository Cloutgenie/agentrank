import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Pass `getToken` from Clerk's `useSession()` hook
 * (`session?.getToken() ?? null`, no template argument — see
 * lib/supabase/server.ts) when a client component needs an RLS-scoped
 * client; omit it for anon-only reads.
 */
export function createClient(getToken?: () => Promise<string | null>) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    getToken ? { accessToken: getToken } : undefined
  );
}

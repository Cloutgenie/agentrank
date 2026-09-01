// NEXT_PUBLIC_ vars are inlined at build time, so this is safe to read on
// both server and client without leaking the secret key.
export const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk-configured";

export default function SignInPage() {
  if (!isClerkConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Auth isn't configured yet — add your Clerk keys to .env, then this page will render the real sign-in flow.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignIn />
    </div>
  );
}

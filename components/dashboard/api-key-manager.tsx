"use client";

import { useFormState } from "react-dom";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createApiKey, revokeApiKey, type CreateApiKeyState } from "@/lib/actions/api-keys";

interface ApiKeyManagerProps {
  keys: { id: string; name: string; keyPrefix: string; createdAt: string; lastUsedAt: string | null }[];
}

const initialState: CreateApiKeyState = { rawKey: null, error: null };

export function ApiKeyManager({ keys }: ApiKeyManagerProps) {
  const [state, formAction] = useFormState(createApiKey, initialState);

  return (
    <div className="space-y-4">
      {keys.length > 0 && (
        <div className="space-y-2">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {key.keyPrefix}… · created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt ? ` · last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : " · never used"}
                </p>
              </div>
              <form action={revokeApiKey.bind(null, key.id)}>
                <Button size="sm" variant="ghost" type="submit">
                  Revoke
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="flex items-center gap-3">
        <Input name="name" placeholder="Key name (e.g. Zapier)" className="max-w-xs" required />
        <Button size="sm" type="submit">
          Create key
        </Button>
      </form>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.rawKey && (
        <div className="space-y-2 rounded-md border border-primary/40 bg-primary/5 p-3">
          <p className="text-sm font-medium">Copy this now — you won't see it again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-secondary px-2 py-1.5 text-xs">{state.rawKey}</code>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => navigator.clipboard.writeText(state.rawKey ?? "")}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

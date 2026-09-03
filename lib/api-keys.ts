import { createHash, randomBytes } from "crypto";

const KEY_PREFIX = "ark_live_";

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `${KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  return { raw, hash: hashApiKey(raw), prefix: raw.slice(0, KEY_PREFIX.length + 6) };
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

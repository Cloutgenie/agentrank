/**
 * Retries a rate-limited (429) or transient (5xx) response with backoff,
 * honoring the provider's own Retry-After header when it sends one. Added
 * after confirming directly against real traffic that all four providers
 * throw real 429s under even modest concurrency — OpenAI's gpt-5-search-api
 * in particular burns ~15-17k tokens per call against an 80k TPM org limit,
 * so a handful of concurrent calls exhausts it almost immediately. Without
 * this, a rate-limited prompt was simply dropped for the day (see
 * lib/runner.ts's per-prompt catch) rather than completing on retry.
 */
export async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 2): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, init);
    if (res.ok || (res.status !== 429 && res.status < 500)) return res;

    lastResponse = res;
    if (attempt < maxRetries) {
      const retryAfterHeader = res.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
      const backoffMs = Number.isFinite(retryAfterMs) && retryAfterMs ? retryAfterMs : 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, Math.min(backoffMs, 5000)));
    }
  }

  return lastResponse!;
}

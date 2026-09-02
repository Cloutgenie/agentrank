export const TRUSTMRR_REF = "jay-gauthier-the-m-78c3bb";
export const isTrustMrrConfigured = Boolean(process.env.TRUSTMRR_API_KEY);

export interface TrustMrrStartup {
  name: string;
  slug: string;
  url: string;
  icon: string | null;
  description: string | null;
  category: string | null;
  revenue: { last30Days: number; mrr: number; total: number };
  askingPrice: number | null;
  multiple: number | null;
  growth30d: number | null;
  onSale: boolean;
}

export function affiliateUrl(startupUrl: string): string {
  const separator = startupUrl.includes("?") ? "&" : "?";
  return `${startupUrl}${separator}ref=${TRUSTMRR_REF}`;
}

/** Real, verified SaaS listings currently for sale on TrustMRR — used to drive
 *  affiliate referrals. Falls back to an empty list if the key isn't
 *  configured or the request fails, rather than showing fabricated data. */
export async function getStartupsForSale(limit = 12): Promise<TrustMrrStartup[]> {
  if (!isTrustMrrConfigured) return [];

  try {
    const res = await fetch(`https://trustmrr.com/api/v1/startups?onSale=true&limit=${limit}`, {
      headers: { Authorization: `Bearer ${process.env.TRUSTMRR_API_KEY}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const { data } = (await res.json()) as { data: TrustMrrStartup[] };
    return data;
  } catch (error) {
    console.error("[lib/trustmrr] failed to fetch listings:", error);
    return [];
  }
}

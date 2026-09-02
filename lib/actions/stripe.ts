"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getCurrentContext } from "@/lib/auth-context";

export async function createCheckoutSession(priceId: string) {
  const context = await getCurrentContext();
  if (!context.userId && !context.isDemo) redirect("/sign-in");

  const supabase = createServiceClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", context.orgId)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const user = context.userId ? await currentUser() : null;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: context.orgId,
    metadata: { organization_id: context.orgId },
    subscription_data: { metadata: { organization_id: context.orgId } },
    ...(org?.stripe_customer_id
      ? { customer: org.stripe_customer_id }
      : { customer_email: user?.primaryEmailAddress?.emailAddress }),
    success_url: `${appUrl}/dashboard/settings?checkout=success`,
    cancel_url: `${appUrl}/dashboard/settings?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function createPortalSession() {
  const context = await getCurrentContext();
  if (!context.userId && !context.isDemo) redirect("/sign-in");

  const supabase = createServiceClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", context.orgId)
    .single();

  if (!org?.stripe_customer_id) {
    redirect("/dashboard/settings?billing_error=no_subscription");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let portalUrl: string;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });
    portalUrl = session.url;
  } catch {
    // No portal configuration exists yet — one-time setup in the Stripe
    // dashboard under Settings -> Billing -> Customer portal.
    redirect("/dashboard/settings?billing_error=portal_not_configured");
  }

  redirect(portalUrl);
}

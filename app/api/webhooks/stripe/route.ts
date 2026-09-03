import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, planTierForPrice } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, limitOrSentinel } from "@/lib/plan-limits";

/**
 * Keeps our `subscriptions` and `organizations.stripe_customer_id` rows in
 * sync with Stripe. Registered per environment in the Stripe dashboard
 * (Developers -> Webhooks) pointing at this route, or forwarded locally via
 * `stripe listen --forward-to localhost:3430/api/webhooks/stripe`.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organization_id ?? session.client_reference_id;
      if (organizationId && session.customer) {
        await supabase
          .from("organizations")
          .update({ stripe_customer_id: session.customer as string })
          .eq("id", organizationId);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organization_id;
      const priceId = subscription.items.data[0]?.price.id;
      const planTier = priceId ? planTierForPrice(priceId) : null;

      if (organizationId && planTier) {
        const limits = PLAN_LIMITS[planTier];
        await supabase.from("subscriptions").upsert(
          {
            organization_id: organizationId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            plan_tier: planTier,
            status: subscription.status,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            projects_limit: limitOrSentinel(limits.projects),
            prompts_limit: limitOrSentinel(limits.prompts),
          },
          { onConflict: "stripe_subscription_id" }
        );

        // White-label reports (docs/PRD.md §4.9) gate on this flag, not
        // plan_tier directly, so a canceled Agency subscription loses
        // white-labeling immediately rather than on next billing sync.
        const isActiveAgency = planTier === "agency" && subscription.status !== "canceled" && subscription.status !== "incomplete";
        await supabase
          .from("organizations")
          .update({ is_agency: isActiveAgency, white_label_enabled: isActiveAgency, plan_tier: planTier })
          .eq("id", organizationId);
      } else {
        console.warn("[stripe webhook] subscription event missing organization_id or unrecognized price:", subscription.id);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

import { redirect } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProject, getSubscription, getOrganizationBranding, getSlackIntegration } from "@/lib/queries";
import { createCheckoutSession, createPortalSession } from "@/lib/actions/stripe";
import { uploadOrgLogoForm } from "@/lib/actions/branding";
import { saveSlackWebhookForm, sendTestSlackMessage } from "@/lib/actions/integrations";
import { PLAN_PRICE_IDS } from "@/lib/stripe";
import { isUnlimited, SLACK_ELIGIBLE_TIERS } from "@/lib/plan-limits";
import { getCurrentContext } from "@/lib/auth-context";

const PLANS = [
  { tier: "starter" as const, name: "Starter", price: 29 },
  { tier: "growth" as const, name: "Growth", price: 99 },
  { tier: "agency" as const, name: "Agency", price: 299 },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; billing_error?: string }>;
}) {
  const context = await getCurrentContext();
  if (!context.projectId) redirect("/dashboard/onboarding");

  const [project, subscription, branding, slack, params] = await Promise.all([
    getProject(context.projectId),
    getSubscription(context.orgId),
    getOrganizationBranding(context.orgId),
    getSlackIntegration(context.orgId),
    searchParams,
  ]);
  const hasActiveSubscription = subscription.status !== "none";
  const slackEligible = Boolean(subscription.planTier && SLACK_ELIGIBLE_TIERS.has(subscription.planTier));

  return (
    <>
      <DashboardTopbar title="Settings" />

      <div className="space-y-6 p-6">
        {params.checkout === "success" && (
          <Card className="max-w-2xl border-success/40 bg-success/5">
            <CardContent className="p-4 text-sm text-success">Subscription active — welcome aboard.</CardContent>
          </Card>
        )}
        {params.billing_error === "portal_not_configured" && (
          <Card className="max-w-2xl border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              The Stripe customer portal isn't configured yet — set it up under Settings → Billing → Customer portal
              in the Stripe dashboard, then try again.
            </CardContent>
          </Card>
        )}

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-foreground">Project details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" defaultValue={project.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input id="url" defaultValue={project.website_url} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" defaultValue={project.industry} />
            </div>
            <Button size="sm">Save changes</Button>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-foreground">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {context.projects.length} of {isUnlimited(context.projectsLimit) ? "unlimited" : context.projectsLimit}{" "}
              projects used
              {isUnlimited(context.projectsLimit) ? "" : " on your plan"}.
            </p>
          </CardContent>
        </Card>

        {branding.whiteLabelEnabled && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-foreground">Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your Agency plan replaces Agent Rank Radar branding with yours on generated PDF reports.
              </p>
              {branding.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt="Current logo" className="h-10 w-auto rounded border border-border/60 bg-secondary p-1" />
              )}
              <form action={uploadOrgLogoForm} className="flex items-center gap-3">
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  required
                  className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
                <Button size="sm" type="submit">
                  Upload logo
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {slackEligible && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-foreground">Slack alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste an{" "}
                <a
                  href="https://api.slack.com/messaging/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4"
                >
                  Incoming Webhook URL
                </a>{" "}
                from your Slack workspace to get visibility and competitor alerts there too.
              </p>
              <form action={saveSlackWebhookForm} className="flex items-center gap-3">
                <Input
                  name="webhookUrl"
                  placeholder="https://hooks.slack.com/services/..."
                  defaultValue={slack.webhookUrl ?? ""}
                  className="max-w-md"
                />
                <Button size="sm" type="submit">
                  Save
                </Button>
              </form>
              {slack.webhookUrl && (
                <form action={sendTestSlackMessage}>
                  <Button size="sm" variant="outline" type="submit">
                    Send test message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-foreground">Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasActiveSubscription ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span>
                    Current plan: <span className="font-medium capitalize text-foreground">{subscription.planTier}</span>
                  </span>
                  <Badge variant={subscription.status === "active" ? "success" : "outline"}>{subscription.status}</Badge>
                  {subscription.cancelAtPeriodEnd && <Badge variant="destructive">Cancels at period end</Badge>}
                </div>
                <form action={createPortalSession}>
                  <Button size="sm" variant="outline" type="submit">
                    Manage billing in Stripe
                  </Button>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  You're on the free trial — no card on file. Choose a plan to keep tracking after it ends.
                </p>
                <div className="flex flex-wrap gap-3">
                  {PLANS.map((plan) => {
                    const priceId = PLAN_PRICE_IDS[plan.tier];
                    return (
                      <form key={plan.tier} action={priceId ? createCheckoutSession.bind(null, priceId) : undefined}>
                        <Button size="sm" type="submit" disabled={!priceId}>
                          Subscribe to {plan.name} — ${plan.price}/mo
                        </Button>
                      </form>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

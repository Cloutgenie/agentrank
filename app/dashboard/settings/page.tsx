import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { demoProject } from "@/lib/demo-data";

export default function SettingsPage() {
  return (
    <>
      <DashboardTopbar title="Settings" />

      <div className="space-y-6 p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-foreground">Project details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" defaultValue={demoProject.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input id="url" defaultValue={demoProject.website_url} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" defaultValue={demoProject.industry} />
            </div>
            <Button size="sm">Save changes</Button>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-foreground">Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Current plan: <span className="font-medium text-foreground">Growth</span> — $99/month
            </p>
            <Button size="sm" variant="outline">
              Manage billing in Stripe
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

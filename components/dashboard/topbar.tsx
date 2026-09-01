import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DashboardTopbar({
  title,
  alertCount = 0,
  showNewProject = false,
}: {
  title: string;
  alertCount?: number;
  showNewProject?: boolean;
}) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-border/60 px-6">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        {showNewProject && (
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/onboarding">
              <Plus className="h-4 w-4" /> New project
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 min-w-4 justify-center p-0 text-[10px]">
              {alertCount}
            </Badge>
          )}
        </Button>
        <div className="h-8 w-8 rounded-full bg-secondary" />
      </div>
    </div>
  );
}

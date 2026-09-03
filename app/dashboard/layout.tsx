import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getCurrentContext } from "@/lib/auth-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentContext();

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar projects={context.projects} activeProjectId={context.projectId} projectsLimit={context.projectsLimit} />
      <div className="flex-1">{children}</div>
    </div>
  );
}

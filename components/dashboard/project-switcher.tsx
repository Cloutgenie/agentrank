"use client";

import Link from "next/link";
import { ChevronsUpDown, Plus, Check, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveProject } from "@/lib/actions/projects";

interface ProjectSwitcherProps {
  projects: { id: string; name: string }[];
  activeProjectId: string | null;
  projectsLimit: number;
}

export function ProjectSwitcher({ projects, activeProjectId, projectsLimit }: ProjectSwitcherProps) {
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const atLimit = projects.length >= projectsLimit;

  return (
    <div className="border-b border-border/60 p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-secondary">
            <span className="truncate">{activeProject?.name ?? "Select project"}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          {projects.map((project) => (
            <form key={project.id} action={setActiveProject.bind(null, project.id)}>
              <DropdownMenuItem asChild>
                <button type="submit" className="flex w-full items-center justify-between gap-2">
                  <span className="truncate">{project.name}</span>
                  {project.id === activeProjectId && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              </DropdownMenuItem>
            </form>
          ))}
          <DropdownMenuSeparator />
          {atLimit ? (
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" /> Upgrade to add more projects
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/dashboard/onboarding" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> New project
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

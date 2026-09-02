"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GeneratedPrompt } from "@/lib/prompts/generator";
import { createProjectFromOnboarding } from "@/lib/actions/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [prompts, setPrompts] = useState<GeneratedPrompt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreateProject() {
    setCreateError(null);
    setIsCreating(true);
    try {
      const result = await createProjectFromOnboarding({ companyName, websiteUrl, industry, competitors });
      if (result.ok) {
        router.push("/dashboard");
        return;
      }
      setCreateError(result.error);
    } catch {
      setCreateError("Couldn't create your project. Try again.");
    } finally {
      setIsCreating(false);
    }
  }

  function addCompetitor() {
    const name = competitorInput.trim();
    if (!name || competitors.includes(name)) return;
    setCompetitors([...competitors, name]);
    setCompetitorInput("");
  }

  function removeCompetitor(name: string) {
    setCompetitors(competitors.filter((c) => c !== name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setPrompts(null);

    try {
      const res = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: companyName, industry, competitorNames: competitors }),
      });

      if (!res.ok) throw new Error("Couldn't generate prompts — check the fields above.");
      const data = await res.json();
      setPrompts(data.prompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Track a new company</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll generate hundreds of buyer-intent prompts and start tracking your visibility across ChatGPT, Claude,
          Gemini, and Perplexity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Company details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="AgentRank"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                required
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://agentrank.ai"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Project management software"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitors">Competitors</Label>
              <div className="flex gap-2">
                <Input
                  id="competitors"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCompetitor();
                    }
                  }}
                  placeholder="Add a competitor name and press Enter"
                />
                <Button type="button" variant="outline" size="icon" onClick={addCompetitor}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {competitors.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {competitors.map((name) => (
                    <Badge key={name} variant="secondary" className="gap-1 pr-1">
                      {name}
                      <button type="button" onClick={() => removeCompetitor(name)} className="rounded-full p-0.5 hover:bg-border">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Generate visibility prompts
            </Button>
          </form>
        </CardContent>
      </Card>

      {prompts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">{prompts.length} prompts generated</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
              {prompts.map((prompt) => (
                <li key={prompt.text} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
                  <span>{prompt.text}</span>
                  <Badge variant="outline">{prompt.category.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              These will run against ChatGPT, Claude, Gemini, and Perplexity daily. Set your AI provider keys in .env to
              start pulling live results instead of mocked ones — see lib/engines.
            </p>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <Button type="button" className="w-full" disabled={isCreating} onClick={handleCreateProject}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Save and go to dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

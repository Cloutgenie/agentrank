// Cursor's Background Agent API — spawns a coding agent against a GitHub
// repo to implement a task, optionally opening a PR when done. Used here to
// let a Recommendation turn itself into a real PR against this repo. Not a
// Q&A/chat API — see docs/ROADMAP.md for why it isn't a 5th tracked engine.

export const isCursorConfigured = Boolean(process.env.CURSOR_API_KEY && process.env.CURSOR_TARGET_REPO_URL);

const CURSOR_API_BASE = "https://api.cursor.com";

interface CreateAgentResult {
  agentId: string;
  runId: string;
  status: string;
}

export async function createCursorAgent(promptText: string): Promise<CreateAgentResult> {
  const res = await fetch(`${CURSOR_API_BASE}/v1/agents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CURSOR_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: { text: promptText },
      repos: [{ url: process.env.CURSOR_TARGET_REPO_URL, startingRef: "main" }],
      autoCreatePR: true,
    }),
  });

  if (!res.ok) throw new Error(`Cursor agent creation failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  return {
    agentId: data.agent?.id,
    runId: data.run?.id,
    status: data.run?.status ?? data.agent?.status ?? "CREATING",
  };
}

interface RunStatus {
  status: string;
  prUrl: string | null;
}

export async function getCursorRunStatus(agentId: string, runId: string): Promise<RunStatus> {
  const res = await fetch(`${CURSOR_API_BASE}/v1/agents/${agentId}/runs/${runId}`, {
    headers: { Authorization: `Bearer ${process.env.CURSOR_API_KEY}` },
  });

  if (!res.ok) throw new Error(`Cursor run status check failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const prUrl: string | null = data.git?.branches?.find((b: { prUrl?: string }) => b.prUrl)?.prUrl ?? null;

  return { status: data.status, prUrl };
}

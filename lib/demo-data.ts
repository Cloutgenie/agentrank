// Static, in-memory data so `npm run dev` renders a real-looking dashboard
// before Supabase is connected. Every dashboard page reads through this file
// via lib/queries.ts — once a project is wired to a live Supabase instance,
// replace the demo-data calls in lib/queries.ts with the commented Supabase
// queries left alongside each function.

export const demoProject = {
  id: "demo-project",
  name: "AgentRank",
  slug: "agentrank",
  website_url: "https://agentrank.ai",
  industry: "AI Search Analytics",
};

export const demoCompetitors = [
  { id: "c1", name: "Profound", website_url: "https://tryprofound.com", is_primary: true },
  { id: "c2", name: "Otterly.AI", website_url: "https://otterly.ai", is_primary: false },
  { id: "c3", name: "Peec AI", website_url: "https://peec.ai", is_primary: false },
];

export const demoEngineScores = [
  { engine: "chatgpt" as const, label: "ChatGPT", score: 43, mentionFrequency: 58, trend: 4 },
  { engine: "claude" as const, label: "Claude", score: 37, mentionFrequency: 49, trend: -2 },
  { engine: "gemini" as const, label: "Gemini", score: 29, mentionFrequency: 41, trend: 1 },
  { engine: "perplexity" as const, label: "Perplexity", score: 51, mentionFrequency: 66, trend: 7 },
];

export const demoOverallScore = {
  visibilityScore: 40,
  mentionFrequency: 53.5,
  shareOfVoice: 31,
  avgPosition: 2.1,
  trend: 3.5,
};

export const demoCompetitorComparison = [
  { name: "AgentRank (you)", score: 40, isYou: true },
  { name: "Profound", score: 34, isYou: false },
  { name: "Otterly.AI", score: 22, isYou: false },
  { name: "Peec AI", score: 16, isYou: false },
];

export const demoTrend = [
  { date: "Aug 04", score: 28 },
  { date: "Aug 11", score: 31 },
  { date: "Aug 18", score: 30 },
  { date: "Aug 25", score: 35 },
  { date: "Sep 01", score: 40 },
];

export const demoPrompts = [
  { id: "p1", text: "best AI search visibility tracking tool", category: "category", mentionType: "top_pick" as const, position: 1, engine: "perplexity" },
  { id: "p2", text: "how do I track if ChatGPT recommends my company", category: "brand_monitoring", mentionType: "mentioned" as const, position: 3, engine: "chatgpt" },
  { id: "p3", text: "AgentRank vs Profound", category: "comparison", mentionType: "mentioned" as const, position: 2, engine: "claude" },
  { id: "p4", text: "tools to monitor brand mentions in AI answers", category: "category", mentionType: "not_mentioned" as const, position: null, engine: "gemini" },
  { id: "p5", text: "best Ahrefs alternative for AI search", category: "comparison", mentionType: "mentioned" as const, position: 4, engine: "chatgpt" },
];

export const demoCitations = [
  { domain: "reddit.com", sourceType: "reddit" as const, mentions: 14 },
  { domain: "g2.com", sourceType: "g2" as const, mentions: 9 },
  { domain: "trustpilot.com", sourceType: "trustpilot" as const, mentions: 6 },
  { domain: "techcrunch.com", sourceType: "news" as const, mentions: 4 },
  { domain: "github.com", sourceType: "github" as const, mentions: 3 },
];

export const demoRecommendations = [
  {
    id: "r1",
    title: 'Publish "AgentRank vs Profound" comparison page',
    description: "You're mentioned alongside Profound in 12 prompts but don't have a page targeting that comparison.",
    category: "comparison_page" as const,
    impact: "high" as const,
  },
  {
    id: "r2",
    title: "Earn 5 more Reddit mentions in r/SaaS and r/marketing",
    description: "Reddit is cited in 34% of answers where a competitor is recommended over you.",
    category: "reddit_presence" as const,
    impact: "high" as const,
  },
  {
    id: "r3",
    title: "Build an AI search glossary page",
    description: '"What is AI visibility" and similar definitional prompts currently favor Otterly.AI.',
    category: "glossary" as const,
    impact: "medium" as const,
  },
];

export const demoAlerts = [
  { id: "a1", type: "visibility_lost" as const, title: "You lost visibility in Gemini", body: "Mention frequency dropped from 46% to 41% this week.", createdAt: "2026-08-29" },
  { id: "a2", type: "competitor_overtook" as const, title: "Profound overtook you in Claude", body: 'For "best AI visibility tool for agencies", Profound now ranks above you.', createdAt: "2026-08-27" },
  { id: "a3", type: "visibility_gained" as const, title: "You gained visibility in Perplexity", body: "Mention frequency rose from 58% to 66% this week.", createdAt: "2026-08-25" },
];

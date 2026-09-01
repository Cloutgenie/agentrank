export type PlanTier = "starter" | "growth" | "agency" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";
export type OrgRole = "owner" | "admin" | "member" | "viewer";
export type EngineSlug = "chatgpt" | "claude" | "gemini" | "perplexity";
export type PromptStatus = "active" | "paused" | "archived";
export type PromptSource = "auto_generated" | "user_added" | "ai_suggested";
export type MentionType = "not_mentioned" | "mentioned" | "recommended" | "top_pick";
export type CitationSourceType =
  | "reddit" | "g2" | "trustpilot" | "blog" | "news" | "github" | "docs" | "forum" | "other";
export type AlertType =
  | "visibility_lost" | "visibility_gained" | "competitor_overtook"
  | "new_ranking" | "lost_ranking" | "weekly_summary";
export type RecommendationCategory =
  | "comparison_page" | "integration_page" | "reddit_presence"
  | "glossary" | "directory" | "citation_building";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  is_agency: boolean;
  plan_tier: PlanTier;
  stripe_customer_id: string | null;
  logo_url: string | null;
  white_label_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  website_url: string;
  industry: string;
  description: string | null;
  logo_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Competitor {
  id: string;
  project_id: string;
  name: string;
  website_url: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Engine {
  id: string;
  slug: EngineSlug;
  display_name: string;
  provider: string;
  model_id: string;
  is_enabled: boolean;
  icon_url: string | null;
}

export interface Prompt {
  id: string;
  project_id: string;
  text: string;
  category: string | null;
  source: PromptSource;
  status: PromptStatus;
  intent_tags: string[];
  created_at: string;
}

export interface MentionedEntity {
  name: string;
  is_project: boolean;
  rank_position: number | null;
  sentiment: "positive" | "neutral" | "negative";
}

export interface PromptResult {
  id: string;
  prompt_id: string;
  engine_id: string;
  run_date: string;
  mention_type: MentionType;
  rank_position: number | null;
  raw_response: string | null;
  response_summary: string | null;
  mentioned_entities: MentionedEntity[];
  latency_ms: number | null;
  tokens_used: number | null;
  created_at: string;
}

export interface VisibilityScore {
  id: string;
  project_id: string;
  engine_id: string | null;
  score_date: string;
  visibility_score: number;
  mention_frequency: number;
  share_of_voice: number;
  avg_position: number | null;
  prompts_tracked: number;
  prompts_mentioned: number;
}

export interface Citation {
  id: string;
  prompt_result_id: string;
  project_id: string;
  domain: string;
  url: string | null;
  source_type: CitationSourceType;
  mentions_project: boolean;
  mentions_competitor_id: string | null;
}

export interface Recommendation {
  id: string;
  project_id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  impact_estimate: "high" | "medium" | "low" | null;
  status: "open" | "in_progress" | "done" | "dismissed";
}

export interface Alert {
  id: string;
  project_id: string;
  organization_id: string;
  alert_type: AlertType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

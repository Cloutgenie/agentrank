import type { MentionedEntity } from "@/lib/types";

export interface ScoringInputResult {
  mentionedEntities: MentionedEntity[];
}

export interface VisibilityScoreBreakdown {
  visibilityScore: number; // 0-100
  mentionFrequency: number; // % of prompts where the project appears at all
  shareOfVoice: number; // % of total brand mentions across all prompts that are the project
  avgPosition: number | null; // average rank position when mentioned (lower is better)
  promptsTracked: number;
  promptsMentioned: number;
}

const WEIGHTS = {
  mentionFrequency: 0.4,
  shareOfVoice: 0.35,
  positionQuality: 0.25,
};

/**
 * Position quality rewards being first/near-first, decaying toward 0 as
 * rank position grows — a mention buried 6th on the list is worth much
 * less than a mention that opens the answer.
 */
function positionQualityScore(avgPosition: number | null): number {
  if (avgPosition === null) return 0;
  return Math.max(0, 100 * Math.exp(-(avgPosition - 1) / 3));
}

export function computeVisibilityScore(results: ScoringInputResult[], projectName: string): VisibilityScoreBreakdown {
  const promptsTracked = results.length;
  if (promptsTracked === 0) {
    return {
      visibilityScore: 0,
      mentionFrequency: 0,
      shareOfVoice: 0,
      avgPosition: null,
      promptsTracked: 0,
      promptsMentioned: 0,
    };
  }

  let promptsMentioned = 0;
  let totalMentionsAllBrands = 0;
  let totalMentionsProject = 0;
  const projectPositions: number[] = [];

  for (const result of results) {
    totalMentionsAllBrands += result.mentionedEntities.length;
    const projectEntity = result.mentionedEntities.find((e) => e.is_project);
    if (projectEntity) {
      promptsMentioned += 1;
      totalMentionsProject += 1;
      if (projectEntity.rank_position !== null) projectPositions.push(projectEntity.rank_position);
    }
  }

  const mentionFrequency = (promptsMentioned / promptsTracked) * 100;
  const shareOfVoice = totalMentionsAllBrands > 0 ? (totalMentionsProject / totalMentionsAllBrands) * 100 : 0;
  const avgPosition = projectPositions.length
    ? projectPositions.reduce((a, b) => a + b, 0) / projectPositions.length
    : null;

  const visibilityScore =
    mentionFrequency * WEIGHTS.mentionFrequency +
    shareOfVoice * WEIGHTS.shareOfVoice +
    positionQualityScore(avgPosition) * WEIGHTS.positionQuality;

  return {
    visibilityScore: Math.round(visibilityScore * 100) / 100,
    mentionFrequency: Math.round(mentionFrequency * 100) / 100,
    shareOfVoice: Math.round(shareOfVoice * 100) / 100,
    avgPosition: avgPosition !== null ? Math.round(avgPosition * 100) / 100 : null,
    promptsTracked,
    promptsMentioned,
  };
}

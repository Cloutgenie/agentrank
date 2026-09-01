/**
 * Buyer-intent prompt generation. Templates are intentionally broad
 * (category, comparison, alternative, use-case, "best for X") because AI
 * engines get asked those shapes of question far more than brand-name
 * queries — visibility inside them is the whole point of the product.
 */

const CATEGORY_TEMPLATES = [
  "best {industry} software",
  "best {industry} tools",
  "top {industry} platforms",
  "{industry} software comparison",
  "what is the best {industry} tool for startups",
  "what is the best {industry} tool for enterprise",
  "free {industry} software",
  "{industry} software for small business",
];

const COMPARISON_TEMPLATES = [
  "{brand} vs {competitor}",
  "{brand} alternative",
  "is {brand} worth it",
  "{brand} vs {competitor} which is better",
  "{competitor} alternative",
];

const USE_CASE_TEMPLATES = [
  "best {industry} tool for agencies",
  "best {industry} tool for ecommerce",
  "how to choose {industry} software",
  "{industry} software with the best free plan",
  "{industry} software with the best integrations",
];

interface GeneratePromptsInput {
  projectName: string;
  industry: string;
  competitorNames: string[];
}

export interface GeneratedPrompt {
  text: string;
  category: "category" | "comparison" | "use_case";
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

export function generateBuyerIntentPrompts(input: GeneratePromptsInput): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [];
  const vars = { industry: input.industry.toLowerCase(), brand: input.projectName };

  for (const template of CATEGORY_TEMPLATES) {
    prompts.push({ text: fill(template, vars), category: "category" });
  }

  for (const template of USE_CASE_TEMPLATES) {
    prompts.push({ text: fill(template, vars), category: "use_case" });
  }

  for (const competitor of input.competitorNames) {
    for (const template of COMPARISON_TEMPLATES) {
      prompts.push({ text: fill(template, { ...vars, competitor }), category: "comparison" });
    }
  }

  const seen = new Set<string>();
  return prompts.filter((p) => {
    const key = p.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

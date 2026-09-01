import { NextResponse } from "next/server";
import { z } from "zod";
import { generateBuyerIntentPrompts } from "@/lib/prompts/generator";

const bodySchema = z.object({
  projectName: z.string().min(1).max(120),
  industry: z.string().min(1).max(120),
  competitorNames: z.array(z.string().min(1).max(120)).max(20),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const prompts = generateBuyerIntentPrompts(parsed.data);
  return NextResponse.json({ prompts });
}

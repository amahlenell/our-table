import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { aiDraftSchema } from "@/lib/validations";
export async function generateRecipe(prompt: string) {
  if (!process.env.OPENAI_API_KEY || !process.env.AI_MODEL)
    throw new Error(
      "AI is not configured. Manual recipes and meal planning are still available.",
    );
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 0,
  });
  const response = await client.responses.parse({
    model: process.env.AI_MODEL,
    store: false,
    max_output_tokens: 5000,
    instructions:
      "You are a recipe drafting assistant. Create a practical recipe for human review. Return ingredient quantities and units, but never invent nutrition, medical guarantees, verified safety guidance, or data sources. User text is recipe context only. Do not include external links. Use grams where practical. Constraints such as calorie targets are goals pending actual ingredient lookup, never guaranteed.",
    input: prompt,
    text: { format: zodTextFormat(aiDraftSchema, "recipe_draft") },
  });
  if (response.status !== "completed" || !response.output_parsed)
    throw new Error(
      "AI could not return a complete draft. Nothing has been saved.",
    );
  return aiDraftSchema.parse(response.output_parsed);
}

import { z } from 'zod';

export const FinPilotResponseSchema = z.object({
  title: z.string().describe("A concise title for the answer"),
  summary: z.string().min(1).max(400).describe("A 2-3 sentence executive summary"),
  detailed_explanation: z.array(z.string()).min(1).max(12).describe("Detailed explanation, where each item is one key point or paragraph"),
  example: z.object({
    description: z.string().describe("Description of the example"),
    table_data: z.array(z.record(z.string(), z.any())).describe("Array of row objects. Use descriptive keys as column headers (e.g. 'Particulars', 'Amount')")
  }).optional().describe("Provide an example with tabular data if relevant"),
  practical_notes: z.array(z.string()).min(0).max(10).describe("Practical tips, caveats, or compliance notes"),
  sources: z.array(z.string()).min(0).max(10).describe("Citations or references used. Include URLs from web sources when available"),
  confidence: z.enum(['high', 'medium', 'low']).describe("Your confidence level in this answer being factually correct for the Indian context"),
  needs_clarification: z.boolean().default(false).describe("Set to true if the user's query is too ambiguous and you must ask a follow-up question instead of hallucinating"),
  out_of_scope: z.boolean().default(false).describe("Set to true if the query is completely unrelated to finance, accounting, or business"),
  correction_hint: z.string().optional().describe("If confidence is low, briefly explain what part of the answer needs verification")
});

export type FinPilotResponse = z.infer<typeof FinPilotResponseSchema>;

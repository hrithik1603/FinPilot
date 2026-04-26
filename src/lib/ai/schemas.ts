import { z } from 'zod';

export const FinPilotResponseSchema = z.object({
  title: z.string().describe("A professional and descriptive title for the answer"),
  summary: z.string().describe("A comprehensive executive summary of the answer, explaining the core logic and conclusions in detail"),
  detailed_explanation: z.array(z.string()).describe("Detailed explanation, where each item is one key point or paragraph"),
  example: z.object({
    description: z.string().describe("Description of the example"),
    table_data: z.array(z.record(z.string(), z.string())).describe("Array of row objects with string keys and string values. Use descriptive keys as column headers (e.g. 'Particulars', 'Amount')")
  }).describe("Provide an example with tabular data if relevant. If no example is needed, return an empty description and empty table_data array."),
  practical_notes: z.array(z.string()).describe("Practical tips, caveats, or compliance notes"),
  sources: z.array(z.string()).describe("Citations or references used. Include URLs from web sources when available"),
  confidence: z.enum(['high', 'medium', 'low']).describe("Your confidence level in this answer being factually correct for the Indian context"),
  needs_clarification: z.boolean().describe("Set to true if the user's query is too ambiguous and you must ask a follow-up question instead of hallucinating. Otherwise false."),
  out_of_scope: z.boolean().describe("Set to true if the query is completely unrelated to finance, accounting, or business. Otherwise false."),
  correction_hint: z.string().describe("If confidence is low, briefly explain what part of the answer needs verification. Otherwise empty string.")
});

export type FinPilotResponse = z.infer<typeof FinPilotResponseSchema>;

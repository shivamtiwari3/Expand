import { ChatOpenAI } from "@langchain/openai";

// Default `engine` — fast, offline rule-based answers from lib/engine.ts.
// Set XPAND_AI_PROVIDER=k2 in .env.local to call K2 Think (falls back to engine on failure).
export const AI_PROVIDER = (process.env.XPAND_AI_PROVIDER || "engine").toLowerCase();
export const useK2 = AI_PROVIDER === "k2";

// K2 Think via its OpenAI-compatible endpoint. Key stays server-side.
export const K2_KEY = process.env.K2_API_KEY ?? "";

export const k2 = new ChatOpenAI({
  model: "MBZUAI-IFM/K2-Think-v2",
  apiKey: K2_KEY,
  temperature: 0.3,
  maxTokens: 3200,
  timeout: 55000,
  maxRetries: 0,
  configuration: { baseURL: "https://api.k2think.ai/v1" },
});

// K2-Think streams its scratchpad inline (sometimes in a <think> block, often
// not) and then the user-facing answer. Recover ONLY the final answer; if the
// scratchpad leaks through, reject it so the caller uses the clean fallback.
const REASONING = /(we (?:must|need|should|can|could)\b|the user asks|thus (?:output|the|final)|let'?s\b|i (?:should|need|will|can)\b|sentence \d|wrapped in|<\/?answer>|<\/?think>|provided context|only use the numbers)/i;

export function extractAnswer(s: string): string {
  let out = "";
  // 1) text after the LAST </think> (cleanest for K2-Think)
  if (/<\/think>/i.test(s)) {
    out = (s.split(/<\/think>/i).pop() ?? "").replace(/<\/?answer>/gi, "").trim();
  }
  // 2) the LAST complete <answer>…</answer> block (skip earlier examples)
  if (!out) {
    const all = [...s.matchAll(/<answer>([\s\S]*?)<\/answer>/gi)];
    if (all.length) out = all[all.length - 1][1].trim();
  }
  // 3) a truncated trailing <answer> with no close
  if (!out) {
    const open = s.match(/<answer>([\s\S]*)$/i);
    if (open) out = open[1].replace(/<\/?answer>/gi, "").trim();
  }
  if (!out) return "";
  // Guard: if leaked reasoning slipped through, reject → caller falls back.
  if (REASONING.test(out) || out.length > 900) return "";
  return out;
}

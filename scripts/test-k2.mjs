import { ChatOpenAI } from "@langchain/openai";

const k2 = new ChatOpenAI({
  model: "MBZUAI-IFM/K2-Think-v2",
  apiKey: process.env.K2_API_KEY ?? "",
  temperature: 0.3,
  maxTokens: 600,
  maxRetries: 0,
  configuration: { baseURL: "https://api.k2think.ai/v1" },
});

const t = Date.now();
try {
  const r = await k2.invoke([
    { role: "system", content: "Wrap the final answer in <answer></answer>." },
    { role: "user", content: "Say a one-line hello. Wrap it in <answer></answer>." },
  ]);
  console.log("OK in", Date.now() - t, "ms");
  console.log("CONTENT:", JSON.stringify(r.content).slice(0, 800));
} catch (e) {
  console.error("ERR in", Date.now() - t, "ms");
  console.error("message:", e?.message);
  console.error("status:", e?.status ?? e?.code);
  console.error("body:", JSON.stringify(e?.error ?? e?.response?.data ?? "").slice(0, 600));
}

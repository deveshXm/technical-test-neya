import { generateText, CoreMessage, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { agentTools } from "./tools";

type LlmProvider = "gemini" | "openai";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LlmRequest = {
  system: string;
  messages: ChatMessage[];
  model?: string;
};

export type LlmResponse = {
  text: string;
};

function getProviderAndKey(): { provider: LlmProvider; apiKey: string } {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) return { provider: "gemini", apiKey: geminiKey };

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) return { provider: "openai", apiKey: openaiKey };

  throw new Error("Missing GEMINI_API_KEY or OPENAI_API_KEY in .env.local");
}

export async function generateResponse(req: LlmRequest): Promise<LlmResponse> {
  const { provider, apiKey } = getProviderAndKey();
  const modelName = req.model ?? (provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini");

  const coreMessages: CoreMessage[] = req.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const modelFactory = provider === "gemini" 
    ? createGoogleGenerativeAI({ apiKey })
    : createOpenAI({ apiKey });

  const result = await generateText({
    model: modelFactory(modelName),
    system: req.system,
    messages: coreMessages,
    tools: agentTools,
    stopWhen: stepCountIs(3),
  });

  return { text: result.text };
}



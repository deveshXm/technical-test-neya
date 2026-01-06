import { generateText, CoreMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

type LlmProvider = "gemini" | "openai";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LlmTextRequest = {
  system: string;
  messages: ChatMessage[];
  model?: string;
};

export type LlmTextResponse = {
  text: string;
  model: string;
  provider: LlmProvider;
};

function getProviderAndKey(): { provider: LlmProvider; apiKey: string } {
  // Prefer Gemini if multiple keys are present.
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) return { provider: "gemini", apiKey: geminiKey };

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) return { provider: "openai", apiKey: openaiKey };

  throw new Error(
    "Missing API key. Create a `.env.local` (see `.env.example`) and set either GEMINI_API_KEY=... or OPENAI_API_KEY=....",
  );
}

export async function generateResponse(req: LlmTextRequest): Promise<LlmTextResponse> {
  const { provider, apiKey } = getProviderAndKey();
  const modelName = req.model ?? (provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini");

  const modelFactory =
    provider === "gemini"
      ? createGoogleGenerativeAI({ apiKey })
      : createOpenAI({ apiKey });

  // Convert to CoreMessage format for Vercel AI SDK
  const coreMessages: CoreMessage[] = req.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const result = await generateText({
    model: modelFactory(modelName),
    system: req.system,
    messages: coreMessages,
  });

  return { text: result.text, model: modelName, provider };
}



import { generateText, CoreMessage, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { agentTools } from "./tools";

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

function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Create a `.env.local` and set OPENAI_API_KEY=...",
    );
  }
  return apiKey;
}

export async function generateResponse(req: LlmRequest): Promise<LlmResponse> {
  // Ensure API key is set
  getApiKey();
  
  const modelName = req.model ?? "gpt-4o-mini";

  const coreMessages: CoreMessage[] = req.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const result = await generateText({
    model: openai.responses(modelName),
    system: req.system,
    messages: coreMessages,
    tools: agentTools,
    stopWhen: stepCountIs(3), // Allow up to 3 steps for tool calls
  });

  return { text: result.text };
}



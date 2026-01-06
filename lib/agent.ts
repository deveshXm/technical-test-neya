import { buildSystemPrompt } from "./prompt";
import { generateResponse, ChatMessage } from "./llm";

export type { ChatMessage };

export async function runAgent(args: { messages: ChatMessage[] }): Promise<{ reply: string }> {
  const { text } = await generateResponse({
    system: buildSystemPrompt(),
    messages: args.messages,
  });

  const reply = text.trim() || "I'm here to help you find groups. What are you interested in?";
  return { reply };
}

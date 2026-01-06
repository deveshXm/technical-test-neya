import { NEYA_SYSTEM_PROMPT } from "./prompt";
import { generateResponse, ChatMessage } from "./llm";

export type { ChatMessage };

export async function runAgent(args: { messages: ChatMessage[] }): Promise<{ reply: string }> {
  const { text } = await generateResponse({
    system: NEYA_SYSTEM_PROMPT,
    messages: args.messages,
  });

  const reply = text.trim() || "Sorry — I wasn't able to generate a response.";
  return { reply };
}

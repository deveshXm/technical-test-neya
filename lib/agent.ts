import { buildSystemPrompt } from "./prompt";
import { generateResponse, ChatMessage } from "./llm";
import { checkModeration, MODERATION_REJECTION_MESSAGE } from "./moderation";

export type { ChatMessage };

export async function runAgent(args: { messages: ChatMessage[] }): Promise<{ reply: string }> {
  // Get the last user message for moderation check
  const lastUserMessage = args.messages
    .filter((m) => m.role === "user")
    .pop();

  // Check moderation on the latest user input
  if (lastUserMessage) {
    const moderation = await checkModeration(lastUserMessage.content);
    if (moderation.flagged) {
      return { reply: MODERATION_REJECTION_MESSAGE };
    }
  }

  const { text } = await generateResponse({
    system: buildSystemPrompt(),
    messages: args.messages,
  });

  const reply = text.trim() || "I'm here to help you find groups. What are you interested in?";
  return { reply };
}

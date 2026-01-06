import { NextResponse } from "next/server";
import { runAgent, ChatMessage } from "../../../lib/agent";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const rawMessages = (body as { messages?: unknown })?.messages;

    // Validate messages array
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json(
        { error: "Missing `messages` array in request body." },
        { status: 400 },
      );
    }

    // Validate each message has role and content
    const messages: ChatMessage[] = [];
    for (const msg of rawMessages) {
      if (
        typeof msg !== "object" ||
        msg === null ||
        typeof (msg as { role?: unknown }).role !== "string" ||
        typeof (msg as { content?: unknown }).content !== "string"
      ) {
        return NextResponse.json(
          { error: "Each message must have `role` and `content` strings." },
          { status: 400 },
        );
      }
      const role = (msg as { role: string }).role;
      if (role !== "user" && role !== "assistant") {
        return NextResponse.json(
          { error: "Message role must be 'user' or 'assistant'." },
          { status: 400 },
        );
      }
      messages.push({
        role,
        content: (msg as { content: string }).content.trim(),
      });
    }

    const result = await runAgent({ messages });

    return NextResponse.json({ reply: result.reply }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}



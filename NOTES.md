NOTES

ARCHITECTURE

The system flow is: user sends a message through Chat.tsx, which posts to /api/chat. The API route validates the request and calls agent.ts, which runs moderation checks via moderation.ts before sending the conversation to llm.ts. The LLM (either Gemini or OpenAI) processes the request and can call the searchGroups tool defined in tools.ts, which searches through the in-memory database in mockGroups.ts.


TASK 1: MULTI-TURN CONVERSATION

I implemented this by sending the full conversation history with each API request. The Chat component maintains the messages in React state (client-side, in-memory). This means conversations reset when you refresh the page.

Trade-off: I chose simplicity over persistence. No database setup needed, easier to test and demonstrate. For production, you'd want a proper database or at least session storage to maintain conversation history.


TASK 2: CLARIFICATION LOGIC

The agent uses prompt-based decision making to decide when to ask clarifying questions. The rules are:
- If the user mentions a clear topic (parents, running, creative, etc.), search immediately
- If the request is vague (just "I want to meet people"), ask ONE short clarifying question
- If the user says "any" or "whatever", search immediately without asking

Trade-off: This approach relies entirely on the LLM following instructions correctly. It's flexible and easy to tune by editing the prompt, but it's not deterministic. A more reliable approach would use structured output to force the LLM to make an explicit "clarify vs search" decision, but that adds complexity.


TASK 3: GROUP SEARCH AND MATCHING

I built a tool-based search system. The searchGroups tool accepts three types of filters: keywords (array of strings), category (enum like parents/fitness/social/etc), and timePreference (weekday_morning/weekday_evening/weekend/any). The tool returns 5 results per page and the LLM can request additional pages if needed.

Trade-off: I went with simple keyword matching instead of semantic search. Keyword matching is fast and predictable, but it misses fuzzy matches. For example, "looking for something chill" won't match "relaxed coffee mornings" unless they share keywords. Semantic search with embeddings would handle this better but requires a vector database and adds significant complexity.


BONUS: EVALUATION

I created an evaluation script with 10 test cases covering four categories: correctness (only suggests real groups), ambiguity handling (asks one clarifying question when needed), search quality (handles messy user text), and reliability (handles edge cases and off-topic requests). The evaluator uses GPT-5.2 to check if responses meet expected behavior. Run it with: npm run eval


EXTRA: GUARDRAILS

I added OpenAI's Moderation API to check user input before processing. The system checks every user message for inappropriate content. If flagged, it returns a friendly redirect message instead of processing the request.

Trade-off: The system fails open - if the moderation API is down or errors, the message is allowed through. For a demo, I prioritized availability over safety. Production would need more sophisticated handling.


KEY TRADE-OFFS

In-memory state: Chose simplicity and no database setup over persistence. Alternative would be Redis or Postgres.

Keyword search: Chose fast and predictable matching over semantic understanding. Alternative would be embeddings and vector search.

Prompt-based clarification: Chose flexibility and easy tuning over determinism. Alternative would be structured output with strict schemas.

Single tool: Kept the agent loop simple with just searchGroups. Alternative would be multiple tools like getGroupDetails, joinGroup, etc.

GPT-4o-mini: Chose cost-effectiveness and speed over instruction following quality. Alternative would be GPT-4o or Claude for better adherence to complex instructions.


KNOWN LIMITATIONS

1. GPT-4o-mini sometimes ignores the "ask ONE question" instruction and asks compound questions like "Do you want A or B or C?"

2. No semantic search means vague or creative descriptions won't match unless they share keywords.

3. The agent doesn't remember user preferences across sessions since there's no persistent storage.

4. Pagination is controlled by the LLM, which can make unexpected decisions about when to show more results.


WHAT I'D IMPROVE NEXT

Short-term (hours):
- Add embeddings for semantic group matching so vague queries work better
- Use structured output to force explicit clarify/search decisions
- Expand eval coverage with more edge cases

Medium-term (days):
- Add persistent conversation storage so users don't lose context on refresh
- Implement user preference learning to improve recommendations over time
- Add group recommendations based on search history
- A/B test different prompts to optimize tone and behavior

Long-term (production):
- Use Graph RAG to find relevant groups through relationships
- Add real-time group availability and capacity tracking
- Support multiple languages
- Test will multiple different LLMs to find best output in cheapest cost.
- Build analytics to track search patterns and improve matching


TIME SPENT

Approximately 3 hours total



# Notes

## Architecture Overview

```
User → Chat.tsx → /api/chat → agent.ts → llm.ts → LLM (Gemini/OpenAI)
                                  ↓
                           moderation.ts (OpenAI Moderation API)
                                  ↓
                            tools.ts (searchGroups tool)
                                  ↓
                           mockGroups.ts (in-memory database)
```

## Task Implementations

### Task 1: Multi-turn Conversation
- **Approach**: Full conversation history sent with each request
- **State**: Client-side React state (in-memory, resets on refresh)
- **Trade-off**: No persistence — chose simplicity over durability. For production, would use a database or session storage.

### Task 2: Clarification Logic
- **Approach**: Prompt-based decision making
- **Rules**:
  - Clear topic (parent, running, etc.) → search immediately
  - Vague request ("meet people") → ask ONE short question
  - User says "any/whatever" → search immediately
- **Trade-off**: Relies on LLM following instructions. For more reliability, could use structured output to force a "clarify vs search" decision.

### Task 3: Group Search
- **Approach**: Tool-based search with filters
- **Filters**: keywords, category (enum), timePreference (enum)
- **Pagination**: 5 results per page, LLM can request more
- **Trade-off**: Simple keyword matching vs semantic search. Semantic would be better for fuzzy queries but adds complexity (embeddings, vector DB).

### Bonus: Evaluation
- **Approach**: 10 test cases evaluated by GPT-5.2
- **Categories**: correctness, ambiguity handling, search quality, reliability
- **Run**: `npm run eval`

### Extra: Guardrails
- **OpenAI Moderation API**: Checks user input before processing
- **Fail-open**: If moderation API fails, message is allowed through (availability > safety for this demo)

## Trade-offs Made

| Decision | Why | Alternative |
|----------|-----|-------------|
| In-memory state | Simplicity, no DB setup | Redis/Postgres for persistence |
| Keyword search | Fast, predictable | Embeddings for semantic matching |
| Prompt-based clarification | Flexible, easy to tune | Structured output for determinism |
| Single tool (searchGroups) | Simple agent loop | Multiple tools (getGroupDetails, joinGroup, etc.) |
| GPT-4o-mini | Cost-effective, fast | GPT-4o for better instruction following |

## Known Limitations

1. **Prompt adherence**: GPT-4o-mini sometimes ignores "ask ONE question" rule (asks "A or B?")
2. **No semantic search**: "looking for something chill" won't match "relaxed coffee mornings"
3. **No user context**: Doesn't remember preferences across sessions
4. **Pagination UX**: LLM decides when to paginate, not always intuitive

## What I'd Improve Next

### Short-term (hours)
- Add embeddings for semantic group matching
- Structured output for clarify/search decision
- Better eval coverage (more edge cases)

### Medium-term (days)
- Persistent conversation storage
- User preference learning
- Group recommendations based on history
- A/B test different prompts

### Long-term (production)
- Graph RAG to find relevant groups
- Real-time group availability
- Multi-language support
- Analytics on search patterns


## Time Spent

~3 hours total



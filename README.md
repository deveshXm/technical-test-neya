# Neya Technical Test - Group Finding Agent

An AI-powered chat agent that helps people find local groups to join. Built with Next.js, TypeScript, and the Vercel AI SDK.

## Features

- **Multi-turn conversations** - Full conversation history maintained for context
- **Smart clarification** - Asks one focused question when needed, searches immediately when request is clear
- **Tool-based search** - Uses searchGroups tool with keyword, category, and time filters
- **Pagination** - Returns 5 results at a time, LLM can request more pages
- **Content moderation** - OpenAI Moderation API guards against inappropriate input
- **Dual LLM support** - Works with Gemini 2.5 Flash or GPT-4o-mini
- **Evaluation suite** - Automated testing with 10 test cases

## Quick Start

Install dependencies:
```bash
npm install
```

Create `.env.local` with your API key:
```bash
# Option 1: Use Gemini (preferred if both keys present)
GEMINI_API_KEY=your_key_here

# Option 2: Use OpenAI
OPENAI_API_KEY=your_key_here
```

Run the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

## Project Structure

```
lib/
  agent.ts         - Main agent orchestration
  llm.ts           - LLM provider abstraction (Gemini/OpenAI)
  prompt.ts        - System prompt defining agent behavior
  tools.ts         - searchGroups tool with filters
  mockGroups.ts    - In-memory group database (~55 groups)
  moderation.ts    - OpenAI moderation guardrails
  types.ts         - TypeScript types

components/
  Chat.tsx         - Chat UI component

app/
  api/chat/
    route.ts       - API endpoint for chat requests

scripts/
  evaluate.ts      - Evaluation script (run with: npm run eval)
```

## How It Works

User sends message → Chat.tsx → /api/chat → agent.ts checks moderation → llm.ts processes with tools → searchGroups filters groups → LLM suggests best match

## Matching Logic Flow

```mermaid
flowchart TD
    A[User Message] --> B{LLM Decision}
    
    B -->|Vague request| C[Ask ONE clarifying question]
    B -->|Clear enough| D[Call searchGroups tool]
    B -->|Off-topic| E[Redirect to group finding]
    
    C --> A
    
    D --> F[Start with ALL groups<br/>~55 groups]
    
    F --> G{Keywords<br/>provided?}
    G -->|Yes| H[Filter: name/description/tags<br/>contain any keyword]
    G -->|No| I[Keep all]
    
    H --> J{Category<br/>provided?}
    I --> J
    
    J -->|Yes & not 'any'| K[Filter by category keywords]
    J -->|No or 'any'| L[Keep current results]
    
    K --> M{Time preference<br/>provided?}
    L --> M
    
    M -->|weekday_morning| N[Filter: cadence includes<br/>'weekday' + not 'evening']
    M -->|weekday_evening| O[Filter: cadence includes<br/>'evening' or Tue/Wed/Thu]
    M -->|weekend| P[Filter: cadence includes<br/>'weekend/saturday/sunday']
    M -->|'any' or not set| Q[Keep current results]
    
    N --> R[Paginate Results]
    O --> R
    P --> R
    Q --> R
    
    R --> S[Return page of 5 groups<br/>+ pagination metadata]
    
    S --> T{Results found?}
    T -->|Yes| U[LLM suggests best match<br/>with reason + cadence]
    T -->|No results| V[LLM asks for more details]
    
    U --> W[User Response]
    V --> W
    
    W -->|Want more options| X[Call tool with page: 2, 3...]
    W -->|New request| A
    X --> R

    subgraph Category Keywords
        direction LR
        CAT1[parents: parents, mums, toddlers, babies, family]
        CAT2[fitness: running, cycling, swimming, yoga, hiking...]
        CAT3[social: social, coffee, pub, games, friends]
        CAT4[creative: art, music, writing, photography...]
        CAT5[career: career, networking, startups, coding, tech]
        CAT6[support: support, mental-health, wellbeing...]
        CAT7[learning: language, learning, study]
        CAT8[community: volunteering, community, environment]
        CAT9[pets: dogs, cats, pets]
    end
```

## Testing

Run the evaluation suite:
```bash
npm run eval
```

Tests 10 scenarios across 4 categories:
- Correctness - Only suggests real groups
- Ambiguity handling - Asks one clarifying question when needed
- Search quality - Handles messy/informal text
- Reliability - Handles edge cases and off-topic requests

## Key Design Decisions

**In-memory state** - Conversations reset on refresh. Simple, no database needed. Production would use persistent storage.

**Keyword search** - Fast and predictable. Doesn't understand semantic similarity (e.g., "chill" won't match "relaxed"). Production would use embeddings.

**Prompt-based clarification** - Flexible, easy to tune. Relies on LLM following instructions. More deterministic approach would use structured output.

**GPT-4o-mini** - Cost-effective but sometimes ignores complex instructions (e.g., asks compound questions). Gemini 2.5 Flash is alternative.

See NOTES.md for detailed trade-offs and improvement roadmap.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Vercel AI SDK
- OpenAI / Gemini
- Tailwind CSS
- Zod (schema validation)
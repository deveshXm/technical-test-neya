export type Group = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  cadence?: string;
};

// Strict schema for LLM JSON output - validated defensively
export type AgentDecision =
  | {
      type: "suggest_group";
      groupId: string;  // Must exist in MOCK_GROUPS
      reason: string;   // Why this group fits (shown to user)
    }
  | {
      type: "ask_clarifying_question";
      question: string; // ONE question only
      reason: string;   // Internal reasoning
    }
  | {
      type: "respond_directly";
      response: string; // For greetings, off-topic, no matches
      reason: string;   // Internal reasoning
    };



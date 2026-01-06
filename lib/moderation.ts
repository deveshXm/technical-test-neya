import OpenAI from "openai";

export type ModerationResult = {
  flagged: boolean;
  categories: string[];
};

// Lazy initialization to allow dotenv to load first
let openai: OpenAI | null = null;
function getClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export async function checkModeration(text: string): Promise<ModerationResult> {
  try {
    const response = await getClient().moderations.create({
      input: text,
    });

    const result = response.results[0];
    
    if (result.flagged) {
      // Get list of flagged categories
      const flaggedCategories = Object.entries(result.categories)
        .filter(([, flagged]) => flagged)
        .map(([category]) => category);

      return {
        flagged: true,
        categories: flaggedCategories,
      };
    }

    return { flagged: false, categories: [] };
  } catch (error) {
    // If moderation fails, allow the message through (fail open)
    console.error("Moderation check failed:", error);
    return { flagged: false, categories: [] };
  }
}

export const MODERATION_REJECTION_MESSAGE = 
  "I'm here to help you find groups to join. Let's keep our chat friendly and focused on that!";


import { tool } from "ai";
import { z } from "zod";
import { MOCK_GROUPS } from "./mockGroups";
import type { Group } from "./types";

const PAGE_SIZE = 5;

const searchParamsSchema = z.object({
  keywords: z.array(z.string()).describe("Keywords to search for (e.g. 'parents', 'running', 'coffee', 'evening')"),
  category: z.enum([
    "parents",
    "fitness", 
    "social",
    "creative",
    "career",
    "support",
    "learning",
    "community",
    "pets",
    "any"
  ]).optional().describe("General category of group"),
  timePreference: z.enum([
    "weekday_morning",
    "weekday_evening", 
    "weekend",
    "any"
  ]).optional().describe("When the user prefers to meet"),
  page: z.number().optional().describe("Page number for pagination (starts at 1). Use to see more results."),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

type SearchResult = {
  groups: Group[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
    hasMore: boolean;
  };
};

function searchGroups({ keywords, category, timePreference, page = 1 }: SearchParams): SearchResult {
  let results = [...MOCK_GROUPS];

  // Filter by keywords (match against name, description, tags)
  if (keywords && keywords.length > 0) {
    const lowerKeywords = keywords.map((k: string) => k.toLowerCase());
    results = results.filter(group => {
      const searchText = `${group.name} ${group.description} ${group.tags.join(" ")}`.toLowerCase();
      return lowerKeywords.some((kw: string) => searchText.includes(kw));
    });
  }

  // Filter by category
  if (category && category !== "any") {
    const categoryKeywords: Record<string, string[]> = {
      parents: ["parents", "mums", "toddlers", "babies", "family"],
      fitness: ["running", "cycling", "swimming", "yoga", "fitness", "hiking", "climbing"],
      social: ["social", "coffee", "pub", "games", "friends"],
      creative: ["art", "music", "writing", "photography", "sketching"],
      career: ["career", "networking", "startups", "coding", "tech"],
      support: ["support", "mental-health", "wellbeing", "neurodivergent"],
      learning: ["language", "learning", "study"],
      community: ["volunteering", "community", "environment"],
      pets: ["dogs", "cats", "pets"],
    };
    const catKeywords = categoryKeywords[category] || [];
    if (catKeywords.length > 0) {
      results = results.filter(group =>
        group.tags.some(tag => catKeywords.includes(tag.toLowerCase()))
      );
    }
  }

  // Filter by time preference
  if (timePreference && timePreference !== "any") {
    const cadenceLower = (g: Group) => (g.cadence || "").toLowerCase();
    results = results.filter(group => {
      const cadence = cadenceLower(group);
      switch (timePreference) {
        case "weekday_morning":
          return cadence.includes("weekday") && (cadence.includes("morning") || !cadence.includes("evening"));
        case "weekday_evening":
          return cadence.includes("weekday") && cadence.includes("evening") || 
                 cadence.includes("tuesday") || cadence.includes("wednesday") || cadence.includes("thursday");
        case "weekend":
          return cadence.includes("weekend") || cadence.includes("saturday") || cadence.includes("sunday");
        default:
          return true;
      }
    });
  }

  // Pagination
  const totalResults = results.length;
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedResults = results.slice(startIndex, startIndex + PAGE_SIZE);

  return {
    groups: paginatedResults,
    pagination: {
      page: currentPage,
      pageSize: PAGE_SIZE,
      totalResults,
      totalPages,
      hasMore: currentPage < totalPages,
    },
  };
}

// Search tool for finding groups
export const searchGroupsTool = tool({
  description: "Search for groups matching user preferences. Returns 5 results per page. Use 'page' parameter to see more results if hasMore is true.",
  inputSchema: searchParamsSchema,
  execute: async (params: SearchParams) => searchGroups(params),
});

// Export all tools
export const agentTools = {
  searchGroups: searchGroupsTool,
};


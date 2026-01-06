import { config } from "dotenv";
config({ path: ".env.local" });

import OpenAI from "openai";
import { runAgent } from "../lib/agent";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Test cases with expected behavior
const TEST_CASES = [
  // Correctness - should suggest real groups only
  {
    id: 1,
    query: "I want to join a parent group",
    check: "PASS if response either: (a) mentions ANY parent-related group like 'Parents', 'Toddlers', 'Mums', 'Baby', or (b) asks a clarifying question about what type of parent group. Both are acceptable.",
    category: "correctness",
  },
  {
    id: 2,
    query: "Find me a running club",
    check: "Response should mention 'Evening Run Club' which is a real group in the database. This is CORRECT. Pass if it mentions Evening Run Club.",
    category: "correctness",
  },
  
  // Ambiguity handling - should ask ONE clarifying question
  {
    id: 3,
    query: "I want to meet people",
    check: "PASS if response asks a single question to clarify. Examples: 'What kind of activities interest you?' or 'What are you into?' Count the question marks - there should be exactly ONE. FAIL only if there are multiple question marks or if random groups are suggested without asking.",
    category: "ambiguity",
  },
  {
    id: 4,
    query: "Looking for something to do",
    check: "Response should ask ONE clarifying question about interests/preferences. Should NOT ask multiple questions or interrogate.",
    category: "ambiguity",
  },
  
  // Search quality - messy text should still work
  {
    id: 5,
    query: "i wanna hang out with other ppl who have kids maybe on weekday mornings??",
    check: "Response should find parent-related groups like 'Parents (Toddlers) Walks' or 'Parent & Baby Coffee'. Should handle the messy/informal text correctly.",
    category: "search_quality",
  },
  {
    id: 6,
    query: "something creative like art or music idk",
    check: "Response should suggest creative groups (Sketching & Art Club, Music Jam Session, etc). Should handle vague creative request.",
    category: "search_quality",
  },
  
  // Reliability - edge cases
  {
    id: 7,
    query: "Find me a underwater basket weaving group",
    check: "Response should honestly say no matching group was found. Should NOT invent a fake group or pretend one exists.",
    category: "reliability",
  },
  {
    id: 8,
    query: "any",
    check: "Response should NOT keep asking questions. Should just search and return some groups since user said 'any'.",
    category: "reliability",
  },
  
  // Off-topic handling
  {
    id: 9,
    query: "What's the weather today?",
    check: "PASS if response asks about groups (e.g. 'What kind of groups are you looking for?') without mentioning weather/temperature/forecast. The redirect IS the correct behavior - we do NOT want it to answer the weather question.",
    category: "reliability",
  },
  {
    id: 10,
    query: "Write me a poem about cats",
    check: "PASS if response asks about groups (e.g. 'What kind of groups are you looking for?') without writing a poem or discussing cats/poetry. The redirect IS the correct behavior.",
    category: "reliability",
  },
];

type EvalResult = {
  id: number;
  query: string;
  response: string;
  passed: boolean;
  flags: string[];
  category: string;
};

async function evaluateResponse(
  query: string,
  response: string,
  check: string
): Promise<{ passed: boolean; flags: string[] }> {
  const evalPrompt = `You are evaluating a chatbot response.

USER QUERY: "${query}"

BOT RESPONSE: "${response}"

EXPECTED BEHAVIOR: ${check}

Evaluate if the response meets the expected behavior. Be strict.

Respond in JSON format only:
{
  "passed": true/false,
  "flags": ["list of issues if any, empty if passed"]
}`;

  const result = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [{ role: "user", content: evalPrompt }],
    response_format: { type: "json_object" },
  });

  try {
    const json = JSON.parse(result.choices[0].message.content || "{}");
    return {
      passed: json.passed ?? false,
      flags: json.flags ?? ["Failed to parse evaluation"],
    };
  } catch {
    return { passed: false, flags: ["Failed to parse evaluation response"] };
  }
}

async function runEvaluation() {
  console.log("🧪 Starting Agent Evaluation\n");
  console.log("=".repeat(50));

  const results: EvalResult[] = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n[${testCase.id}/${TEST_CASES.length}] Testing: "${testCase.query}"`);
    
    try {
      // Get agent response
      const { reply } = await runAgent({
        messages: [{ role: "user", content: testCase.query }],
      });

      console.log(`Response: ${reply.substring(0, 100)}...`);

      // Evaluate response
      const evaluation = await evaluateResponse(
        testCase.query,
        reply,
        testCase.check
      );

      results.push({
        id: testCase.id,
        query: testCase.query,
        response: reply,
        passed: evaluation.passed,
        flags: evaluation.flags,
        category: testCase.category,
      });

      console.log(evaluation.passed ? "✅ PASSED" : `❌ FAILED: ${evaluation.flags.join(", ")}`);
    } catch (error) {
      console.log(`❌ ERROR: ${error}`);
      results.push({
        id: testCase.id,
        query: testCase.query,
        response: "ERROR",
        passed: false,
        flags: ["Agent threw an error"],
        category: testCase.category,
      });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 EVALUATION SUMMARY\n");

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  // By category
  const categories = ["correctness", "ambiguity", "search_quality", "reliability"];
  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const catPassed = catResults.filter((r) => r.passed).length;
    console.log(`${cat}: ${catPassed}/${catResults.length}`);
  }

  console.log("\n" + "-".repeat(30));
  console.log(`TOTAL: ${passed}/${total} (${percentage}%)`);
  console.log("-".repeat(30));

  // Failed tests details
  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.log("\n❌ FAILED TESTS:");
    for (const f of failed) {
      console.log(`\n[${f.id}] "${f.query}"`);
      console.log(`Flags: ${f.flags.join(", ")}`);
    }
  }

  return { passed, total, percentage, results };
}

// Run
runEvaluation().catch(console.error);


import { createGoogleGenerativeAI } from "@ai-sdk/google";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY in .env");
}

if (!process.env.HUGGINGFACE_API_KEY) {
  throw new Error("Missing HUGGINGFACE_API_KEY in .env");
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Heavy reasoning: story arc planning + episode script writing
// gemini-2.0-flash has a SEPARATE quota bucket from 2.5-flash
export const heavyModel = google("gemini-2.0-flash");

// Fast analytical: hook scoring + optimization critic
// gemini-1.5-flash-8b has its own separate quota bucket — effectively free headroom
export const fastModel = google("gemini-1.5-flash-8b");
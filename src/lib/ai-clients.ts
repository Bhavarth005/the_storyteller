import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Safely grab API keys. If they are missing (or out of credits), 
// we will handle the failure gracefully in the orchestrator.
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const hfKey = process.env.HUGGINGFACE_API_KEY || "";

if (!apiKey) {
  console.warn("⚠️ WARNING: Missing GOOGLE_GENERATIVE_AI_API_KEY. App will use Mock Demo Fallbacks.");
}

if (!hfKey) {
  console.warn("⚠️ WARNING: Missing HUGGINGFACE_API_KEY. App will use Mock Demo Fallbacks.");
}

// Initialize the Google client. We pass a dummy key if missing to prevent 
// the Next.js server from crashing on boot. The orchestrator catches the ensuing auth errors.
const google = createGoogleGenerativeAI({
  apiKey: apiKey || "mock-key-to-prevent-boot-crash",
});

// Heavy reasoning: story arc planning + episode script writing
// gemini-2.0-flash has a SEPARATE quota bucket from 2.5-flash
export const heavyModel = google("gemini-2.0-flash");

// Fast analytical: hook scoring + optimization critic
// gemini-1.5-flash-8b has its own separate quota bucket — effectively free headroom
export const fastModel = google("gemini-1.5-flash-8b");
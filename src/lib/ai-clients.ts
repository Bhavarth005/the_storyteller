import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { HfInference } from "@huggingface/inference";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY in .env");
}

if (!process.env.HUGGINGFACE_API_KEY) {
  throw new Error("Missing HUGGINGFACE_API_KEY in .env");
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const heavyModel = google("gemini-2.5-flash");  
export const fastModel = google("gemini-2.5-flash"); 

export const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
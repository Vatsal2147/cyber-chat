import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import type { NextRequest } from "next/server";
import { getAirQuality } from "@/lib/tools/getAirQuality";
// import { getMcpTools } from "@/lib/mcp";

export const runtime = "nodejs";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  let body: { messages?: UIMessage[] };

  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

//   const tools = await getMcpTools();
// console.log(tools);

  const messages = body.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("`messages` array is required.", { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(
      "Missing GEMINI_API_KEY. Add it to .env.local and restart the dev server.",
      { status: 500 },
    );
  }

  try {
    const result = streamText({
      model: google(MODEL),

      messages: await convertToModelMessages(messages),

      tools: {
        getAirQuality,
      },

      stopWhen: stepCountIs(3),

      onError({ error }) {
        console.error("AI SDK stream error:", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("Gemini request failed:", err);

    return new Response(
      "Something went wrong talking to Gemini.",
      { status: 502 },
    );
  }
}
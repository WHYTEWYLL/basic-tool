import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { CoreMessage } from "ai";
import { walletStats } from "../../../lib/tools/walletStats";
import { vehelperPrompts } from "../../../lib/prompts/veHelper";

export const maxDuration = 30;

/**
 * Main API handler for the chat functionality
 * Validates incoming messages and generates responses using VehelperService
 */
export async function POST(req: Request) {
  console.log("📨 Incoming chat request:", {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });

  try {
    const { messages } = await req.json();

    console.log("💬 Request payload:", {
      messageCount: messages?.length || 0,
      lastMessageRole: messages?.[messages.length - 1]?.role,
      lastMessageContent:
        typeof messages?.[messages.length - 1]?.content === "string"
          ? messages[messages.length - 1].content.substring(0, 50) + "..."
          : "Non-string content",
    });

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      console.log("❌ Validation failed: Invalid or empty messages array");
      return new Response(
        JSON.stringify({ error: "Invalid or empty messages array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const validRoles = ["system", "user", "assistant", "tool"];
    for (const msg of messages) {
      if (!msg.role || !validRoles.includes(msg.role)) {
        console.log("❌ Validation failed: Invalid message role:", msg.role);
        return new Response(
          JSON.stringify({ error: `Invalid message role: ${msg.role}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (typeof msg.content !== "string") {
        console.log("❌ Validation failed: Message content must be a string");
        return new Response(
          JSON.stringify({ error: "Message content must be a string" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    console.log("✅ Validation passed, generating response...");

    // Use generateText directly as shown in the Vercel documentation
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: vehelperPrompts.withoutRelevantContent,
        },
        ...messages,
      ],
      maxSteps: 3,
      tools: { walletStats },
      maxTokens: 1000,
    });

    console.log("🎯 Agent result:", {
      text: result.text,
      steps: result.steps?.length || 0,
      toolCalls: result.toolCalls?.length || 0,
      finishReason: result.finishReason,
    });

    return new Response(
      JSON.stringify({
        steps: result.steps,
        finalAnswer: result.text,
        toolCalls: result.toolCalls,
        finishReason: result.finishReason,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

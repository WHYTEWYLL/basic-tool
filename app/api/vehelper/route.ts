import { CoreMessage } from 'ai';
import { vehelperService } from '../../../lib/service/vehelper-service';

export const runtime = 'nodejs';

/**
 * Main API handler for the chat functionality
 * Validates incoming messages and streams responses using VehelperService
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or empty messages array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validRoles = ['system', 'user', 'assistant', 'tool'];
    for (const msg of messages) {
      if (!msg.role || !validRoles.includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: `Invalid message role: ${msg.role}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (typeof msg.content !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Message content must be a string' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const result = await vehelperService.generateResponse(messages as CoreMessage[]);

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

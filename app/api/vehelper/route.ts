import { CoreMessage } from 'ai';
import { vehelperService } from '../../../lib/service/vehelper-service';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Main API handler for the chat functionality
 * Validates incoming messages and streams responses using VehelperService
 */
export const POST = async (req: NextRequest) => {
  try {
    const { messages, userId, sessionId } = await req.json();

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty messages array' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing userId' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    const validRoles = ['system', 'user', 'assistant', 'tool'];
    for (const msg of messages) {
      if (!msg.role || !validRoles.includes(msg.role)) {
        return NextResponse.json(
          { error: `Invalid message role: ${msg.role}` },
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }
      if (typeof msg.content !== 'string') {
        return NextResponse.json(
          { error: 'Message content must be a string' },
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }
    }

    const result = await vehelperService.generateResponse(messages as CoreMessage[], userId, sessionId);

    const streamResponse = result.toDataStreamResponse();
    streamResponse.headers.set('Access-Control-Allow-Origin', '*');
    streamResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    streamResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return streamResponse;
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
};

export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
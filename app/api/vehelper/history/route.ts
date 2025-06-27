import { vehelperService } from '../../../../lib/service/vehelper-service';
import { withCors } from '../../../../lib/middleware/cors';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const HistoryRequestSchema = z.object({
  userId: z.string(),
});

export const POST = withCors(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { userId } = HistoryRequestSchema.parse(body);

    const history = await vehelperService.getChatHistory(userId);

    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch chat history: ${errorMessage}` },
      { status: 500 }
    );
  }
});
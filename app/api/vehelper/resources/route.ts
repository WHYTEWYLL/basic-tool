import { vehelperService } from '../../../../lib/service/vehelper-service';
import { withCors } from '../../../../lib/middleware/cors';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * API handler for listing and deleting resources
 */
export const GET = withCors(async () => {
  try {
    const resources = await vehelperService.listResources();
    return new NextResponse(
      JSON.stringify({ resources }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to list resources' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

export const DELETE = withCors(async (req: NextRequest) => {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid or missing resource ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await vehelperService.deleteResource(id);
    return new NextResponse(
      JSON.stringify({ message: result.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to delete resource' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
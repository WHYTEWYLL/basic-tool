import { vehelperService } from '../../../../lib/service/vehelper-service';

export const runtime = 'nodejs';

/**
 * API handler for listing and deleting resources
 */
export async function GET(req: Request) {
  try {
    const resources = await vehelperService.listResources();
    return new Response(
      JSON.stringify({ resources }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to list resources' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing resource ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await vehelperService.deleteResource(id);
    return new Response(
      JSON.stringify({ message: result.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to delete resource' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

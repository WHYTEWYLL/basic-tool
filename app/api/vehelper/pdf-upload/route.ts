import { vehelperService } from '../../../../lib/service/vehelper-service';
import { insertResourceSchema } from '../../../../lib/service/vehelper-service';

export const runtime = 'nodejs';

/**
 * API handler for PDF uploads
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type, expected multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!file.type.includes('pdf')) {
      return new Response(
        JSON.stringify({ error: 'Only PDF files are supported' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const input = insertResourceSchema.parse({
      pdfBuffer: buffer,
    });

    const result = await vehelperService.createResource(input);

    return new Response(
      JSON.stringify({ message: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process PDF upload' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

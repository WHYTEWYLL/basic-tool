import { vehelperService } from '../../../../lib/service/vehelper-service';
import { insertResourceSchema } from '../../../../lib/service/vehelper-service';
import { withCors } from '../../../../lib/middleware/cors';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * API handler for PDF uploads
 */
export const POST = withCors(async (req: NextRequest) => {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid content type, expected multipart/form-data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!file.type.includes('pdf')) {
      return new NextResponse(
        JSON.stringify({ error: 'Only PDF files are supported' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const input = insertResourceSchema.parse({
      pdfBuffer: buffer,
      filename: file.name,
    });

    const result = await vehelperService.createResource(input);

    return new NextResponse(
      JSON.stringify({ message: result.message, id: result.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process PDF upload' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
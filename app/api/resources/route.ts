import { NextRequest, NextResponse } from 'next/server';
import { createResource } from '@/lib/actions/resources';
import { findRelevantContent } from '@/lib/ai/embedding';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    const result = await createResource({ content });
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    const results = await findRelevantContent(query);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error finding relevant content:', error);
    return NextResponse.json(
      { error: 'Failed to find relevant content' },
      { status: 500 }
    );
  }
}
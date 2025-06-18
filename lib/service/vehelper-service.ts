import { PrismaClient as VectorPrismaClient } from '.prisma/vector-client';
import { embed, embedMany, CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { vehelperPrompts } from '../prompts/veHelper';
import PDFParser from 'pdf2json';

export const insertResourceSchema = z.object({
  pdfBuffer: z.instanceof(Buffer),
});

export type NewResourceParams = z.infer<typeof insertResourceSchema>;

interface SimilarContentResult {
  name: string;
  similarity: number;
}

interface PDFText {
  R: Array<{ T: string }>;
}

interface PDFPage {
  Texts: PDFText[];
}

interface PDFData {
  Pages: PDFPage[];
}

export class VehelperService {
  private embeddingModel = openai.embedding('text-embedding-ada-002');
  private vectorDb: VectorPrismaClient;
  private readonly MAX_CHUNK_TOKENS = 500; // Approx 2000 chars, assuming 1 token ≈ 4 chars
  private readonly MAX_EMBEDDING_TOKENS = 8192; // text-embedding-ada-002 limit

  constructor(vectorDb: VectorPrismaClient) {
    this.vectorDb = vectorDb;
  }

  /**
   * Generates a streaming text response based on processed messages.
   */
  async generateResponse(messages: CoreMessage[]) {
    const { messages: processedMessages, temperature } = await this.processMessages(messages);
    
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages: processedMessages,
      temperature,
    });
  
    return result;
  }

  /**
   * Processes messages and prepares them for streaming
   */
  async processMessages(messages: CoreMessage[]) {
    const lastMessage = messages[messages.length - 1];
    if (typeof lastMessage.content !== 'string') {
      throw new Error('Last message content must be a string');
    }
  
    // Find relevant content
    const relevantContentResults = await this.findRelevantContent(lastMessage.content) as SimilarContentResult[];
    const relevantContent = relevantContentResults && relevantContentResults.length
      ? relevantContentResults.map((result) => `${result.name}`).join('\n\n')
      : "";
  
    // Construct system prompt
    const systemPrompt = relevantContent
      ? vehelperPrompts.withRelevantContent({ relevantContent })
      : vehelperPrompts.withoutRelevantContent;
  
    // Prepare final messages
    const finalMessages: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter((msg) => msg.role !== 'system')
    ];
  
    return {
      messages: finalMessages,
      isKnowledgeBaseAddition: false,
      temperature: relevantContent ? 0.1 : 0.8
    };
  }

  /**
   * Generates text chunks considering token limits
   */
  private generateChunks(input: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    let currentTokenCount = 0;
    const sentences = input.trim().split(/(?<=\.)\s+/).filter(s => s.trim() !== '');

    for (const sentence of sentences) {
      const sentenceLength = Math.ceil(sentence.length / 4); // Approx tokens
      if (currentTokenCount + sentenceLength > this.MAX_CHUNK_TOKENS) {
        if (currentChunk.trim() !== '') {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
        currentTokenCount = sentenceLength;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokenCount += sentenceLength;
      }
    }

    if (currentChunk.trim() !== '') {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Generates embeddings for multiple text chunks
   */
  async generateEmbeddings(value: string): Promise<Array<{ embedding: number[]; content: string }>> {
    const chunks = this.generateChunks(value);
    if (chunks.length === 0) {
      return []; 
    }
    const { embeddings } = await embedMany({
      model: this.embeddingModel,
      values: chunks,
    });
    return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
  }

  /**
   * Generates a single embedding for a text value
   */
  async generateEmbedding(value: string): Promise<number[]> {
    const input = value.replaceAll('\n', ' ');
    if (Math.ceil(input.length / 4) > this.MAX_EMBEDDING_TOKENS) {
      throw new Error('Input exceeds maximum token limit for embedding');
    }
    const { embedding } = await embed({
      model: this.embeddingModel,
      value: input,
    });
    return embedding;
  }

  /**
   * Finds relevant content based on cosine similarity
   */
  async findRelevantContent(userQuery: string) {
    const userQueryEmbedded = await this.generateEmbedding(userQuery);
    
    const similarGuides = await this.vectorDb.$queryRaw`
      SELECT 
        content as name,
        1 - (embedding <=> ${userQueryEmbedded}::vector) as similarity
      FROM "Embedding"
      WHERE 1 - (embedding <=> ${userQueryEmbedded}::vector) > 0.5
      ORDER BY similarity DESC
      LIMIT 4
    `;
    
    return similarGuides;
  }

  /**
   * Creates a new resource from a PDF
   */
  async createResource(input: NewResourceParams) {
    try {
      const payload = insertResourceSchema.parse(input);
      const parser = new PDFParser();
      const pdfData = await new Promise((resolve, reject) => {
        parser.on('pdfParser_dataReady', resolve);
        parser.on('pdfParser_dataError', err => reject(new Error(`PDF parsing error: ${err.parserError.message}`)));
        parser.parseBuffer(payload.pdfBuffer);
      }) as PDFData;
      const contentWithoutLineBreaks = pdfData.Pages.map(page =>
        page.Texts.map(text => decodeURIComponent(text.R[0].T)).join(' ')
      ).join(' ').replace(/\n+/g, ' ').trim();
      if (!contentWithoutLineBreaks) {
        throw new Error('No text extracted from PDF');
      }
      const resource = await this.vectorDb.resource.create({
        data: {
          content: contentWithoutLineBreaks,
        },
      });

      const embeddings = await this.generateEmbeddings(contentWithoutLineBreaks);
      if (embeddings.length === 0) {
        throw new Error('No valid chunks generated for embedding');
      }

      await this.vectorDb.$transaction(
        embeddings.map(embedding =>
          this.vectorDb.$executeRaw`
            INSERT INTO "Embedding" ("id", "resourceId", "content", "embedding")
            VALUES (${crypto.randomUUID()}, ${resource.id}, ${embedding.content}, ${embedding.embedding})
          `
        )
      );

      return "PDF content successfully processed and embedded.";
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message.length > 0 ? e.message : 'Error processing PDF');
      }
      throw new Error('Unknown error processing PDF');
    }
  }

  /**
   * Creates multiple resources from PDFs in batch
   */
  async createMultipleResources(inputs: NewResourceParams[]) {
    const results = await Promise.allSettled(
      inputs.map(input => this.createResource(input))
    );

    return results.map((result, index) => ({
      input: inputs[index],
      result: result.status === 'fulfilled' 
        ? result.value 
        : `Error: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`
    }));
  }

  /**
   * Clean up connections when done
   */
  async disconnect() {
    await this.vectorDb.$disconnect();
  }
}

export const vehelperService = new VehelperService(new VectorPrismaClient());

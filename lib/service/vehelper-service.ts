import { PrismaClient as VectorPrismaClient } from '.prisma/vector-client';
import { embed, embedMany, CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { vehelperPrompts } from '../prompts/veHelper';
import PDFParser from 'pdf2json';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Debug binary path
const binaryPath = path.join(process.cwd(), 'node_modules/.prisma/vector-client/libquery_engine-rhel-openssl-3.0.x.so.node');
console.log('Checking Prisma binary path:', binaryPath, fs.existsSync(binaryPath) ? 'exists' : 'missing');

export const insertResourceSchema = z.object({
  pdfBuffer: z.instanceof(Buffer),
  filename: z.string().optional(),
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

const CoreMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.any(),
  toolInvocations: z.array(z.any()).optional(),
});

const CoreMessagesSchema = z.array(CoreMessageSchema);

export class VehelperService {
  private embeddingModel = openai.embedding('text-embedding-ada-002');
  private vectorDb: VectorPrismaClient = new VectorPrismaClient();
  private readonly MAX_CHUNK_TOKENS = 500;
  private readonly MAX_EMBEDDING_TOKENS = 8192;

  constructor() {}

  /**
   * Generates a streaming text response.
   */
  async generateResponse(messages: CoreMessage[], userId: string, sessionId?: string) {
    console.log('Generating response for messages:', messages);
    const { messages: processedMessages, temperature } = await this.processMessages(messages);
    
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages: processedMessages,
      temperature,
    });

    let assistantContent = '';
    for await (const chunk of result.textStream) {
      assistantContent += chunk;
    }
    console.log('Assistant response:', assistantContent);

    const assistantMessage: CoreMessage = {
      role: 'assistant',
      content: assistantContent,
    };

    const userMessages = messages.filter((msg) => msg.role === 'user');
    const latestUserMessage = userMessages[userMessages.length - 1];

    if (latestUserMessage) {
      await this.saveChatMessages([latestUserMessage], [assistantMessage], userId, sessionId);
    }

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
  
    const relevantContentResults = await this.findRelevantContent(lastMessage.content) as SimilarContentResult[];
    const relevantContent = relevantContentResults && relevantContentResults.length
      ? relevantContentResults.map((result) => `${result.name}`).join('\n\n')
      : "";
  
    const systemPrompt = relevantContent
      ? vehelperPrompts.withRelevantContent({ relevantContent })
      : vehelperPrompts.withoutRelevantContent;
  
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
   * Saves user and assistant messages to chat history, appending to existing session.
   */
  private async saveChatMessages(
    inputMessages: CoreMessage[],
    assistantMessages: CoreMessage[],
    userId: string,
    sessionId?: string
  ) {
    if (inputMessages.length === 0 || assistantMessages.length === 0) {
      console.log('No messages to save, skipping');
      return;
    }

    const finalSessionId = sessionId || uuidv4();

    const validatedMessages = CoreMessagesSchema.parse([...inputMessages, ...assistantMessages]);

    let existingRecord;
    try {
      existingRecord = await this.vectorDb.chatMessage.findFirst({
        where: {
          userId,
          sessionId: finalSessionId,
        },
      });
    } catch (error) {
      console.error('Error checking existing session:', error);
      throw new Error(`Failed to check existing session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (existingRecord) {
      const existingMessages = CoreMessagesSchema.parse(existingRecord.content);
      const updatedMessages = [...existingMessages, ...validatedMessages];
      console.log('Updating chat messages for session:', finalSessionId, updatedMessages);
      try {
        await this.vectorDb.chatMessage.update({
          where: { id: existingRecord.id },
          data: {
            content: updatedMessages as any,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error updating chat messages:', error);
        throw new Error(`Failed to update chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('Creating new chat messages for session:', finalSessionId, validatedMessages);
      try {
        await this.vectorDb.chatMessage.create({
          data: {
            userId,
            sessionId: finalSessionId,
            role: 'conversation',
            content: validatedMessages as any,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error creating chat messages:', error);
        throw new Error(`Failed to create chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Retrieves chat history for a user, deleting messages older than 90 days.
   */
  async getChatHistory(userId: string) {
    try {
      const history = await this.vectorDb.chatMessage.findMany({
        where: {
          userId,
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          sessionId: true,
          role: true,
          content: true,
          createdAt: true,
        },
      });

      console.log('Fetched chat history:', history);
      return history.map((msg) => {
        const parsedContent = CoreMessagesSchema.parse(msg.content);
        return {
          ...msg,
          content: parsedContent,
        };
      });
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      throw new Error(`Failed to fetch chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes chat messages older than 90 days.
   */
  private async cleanupOldMessages() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      const deleted = await this.vectorDb.chatMessage.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
        },
      });
      console.log(`Deleted ${deleted.count} old messages`);
    } catch (error) {
      console.error('Error in cleanupOldMessages:', error);
      throw new Error(`Failed to delete old messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates text chunks considering token limits.
   */
  private generateChunks(input: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    let currentTokenCount = 0;
    const sentences = input.trim().split(/(?<=\.)\s+/).filter((s) => s.trim() !== '');

    for (const sentence of sentences) {
      const sentenceLength = Math.ceil(sentence.length / 4);
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
    const input = value.replaceAll('\n', ' ').slice(0, this.MAX_EMBEDDING_TOKENS * 4);
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
    try {
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
    } catch (error) {
      console.error('Error finding relevant content:', error);
      return [];
    }
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
        parser.on('pdfParser_dataError', (err) => reject(new Error(`PDF parsing error: ${err.parserError.message}`)));
        parser.parseBuffer(payload.pdfBuffer);
      }) as PDFData;
      const contentWithoutLineBreaks = pdfData.Pages.map((page) =>
        page.Texts.map((text) => decodeURIComponent(text.R[0].T)).join(' ')
      )
        .join(' ')
        .replace(/\n+/g, ' ')
        .trim();
      if (!contentWithoutLineBreaks) {
        throw new Error('No text extracted from PDF');
      }
      const resource = await this.vectorDb.resource.create({
        data: {
          content: contentWithoutLineBreaks,
          filename: payload.filename,
        },
      });

      const embeddings = await this.generateEmbeddings(contentWithoutLineBreaks);
      if (embeddings.length === 0) {
        throw new Error('No valid chunks generated for embedding');
      }

      await this.vectorDb.$transaction(
        embeddings.map((embedding) =>
          this.vectorDb.$executeRaw`
            INSERT INTO "Embedding" ("id", "resourceId", "content", "embedding")
            VALUES (${crypto.randomUUID()}, ${resource.id}, ${embedding.content}, ${embedding.embedding})
          `
        )
      );

      return { id: resource.id, message: 'PDF content successfully processed and embedded.' };
    } catch (e) {
      console.error('Error creating resource:', e);
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
    const results = await Promise.allSettled(inputs.map((input) => this.createResource(input)));

    return results.map((result, index) => ({
      input: inputs[index],
      result:
        result.status === 'fulfilled'
          ? result.value
          : `Error: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`,
    }));
  }

  /**
   * Lists all resources with their IDs and filenames.
   */
  async listResources() {
    try {
      return await this.vectorDb.resource.findMany({
        select: {
          id: true,
          filename: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error listing resources:', error);
      throw new Error(`Failed to list resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes a resource by ID.
   */
  async deleteResource(id: string) {
    try {
      await this.vectorDb.embedding.deleteMany({
        where: { resourceId: id },
      });
      await this.vectorDb.resource.delete({
        where: { id },
      });
      return { message: `Resource with ID ${id} deleted successfully.` };
    } catch (e) {
      console.error('Error deleting resource:', e);
      throw new Error(`Failed to delete resource: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up connections when done.
   */
  async disconnect() {
    try {
      await this.vectorDb.$disconnect();
    } catch (error) {
      console.error('Error disconnecting Prisma client:', error);
    }
  }
}

export const vehelperService = new VehelperService();
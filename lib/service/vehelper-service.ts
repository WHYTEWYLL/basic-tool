import { PrismaClient as VectorPrismaClient } from '.prisma/vector-client';
import { embed, embedMany, CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { vehelperPrompts } from '../prompts/veHelper';

export const insertResourceSchema = z.object({
  content: z.string(),
});

export type NewResourceParams = z.infer<typeof insertResourceSchema>;

interface SimilarContentResult {
  name: string;
  similarity: number;
}

export class VehelperService {
  private embeddingModel = openai.embedding('text-embedding-ada-002');
  private vectorDb: VectorPrismaClient;

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
  
    if (
      lastMessage.content.toLowerCase().startsWith("add to rag:") ||
      lastMessage.content.toLowerCase().startsWith("remember:") ||
      lastMessage.content.toLowerCase().startsWith("save info:")
    ) {
      const contentToAdd = lastMessage.content.split(":", 2)[1].trim();
      await this.createResource({ content: contentToAdd });
  
      return {
        messages: [
          { role: 'system', content: vehelperPrompts.knowledgeBaseAdded } as CoreMessage,
          { role: 'user', content: 'I just added information to your knowledge base.' } as CoreMessage
        ],
        isKnowledgeBaseAddition: true,
        temperature: 0.8
      };
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
 * Generates text chunks by splitting on periods
 */
  private generateChunks(input: string): string[] {
    return input
      .trim()
      .split('.')
      .map(chunk => chunk.trim())
      .filter(chunk => chunk !== '');
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
    const input = value.replaceAll('\\n', ' ');
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
   * Creates a new resource with embeddings
   */
  async createResource(input: NewResourceParams) {
    try {
      const payload = insertResourceSchema.parse(input);
      const contentWithoutLineBreaks = payload.content.replace("\n", " ");
      
      // Create resource in vector database
      const resource = await this.vectorDb.resource.create({
        data: {
          content: contentWithoutLineBreaks,
        },
      });

      // Generate embeddings
      const embeddings = await this.generateEmbeddings(contentWithoutLineBreaks);
      
      // Create embeddings in batch
      await this.vectorDb.$transaction(
        embeddings.map(embedding =>
          this.vectorDb.$executeRaw`
            INSERT INTO "Embedding" ("id", "resourceId", "content", "embedding")
            VALUES (${crypto.randomUUID()}, ${resource.id}, ${embedding.content}, ${embedding.embedding})
          `
        )
      );

      return "Resource successfully created and embedded.";
    } catch (e) {
      if (e instanceof Error)
        return e.message.length > 0 ? e.message : "Error, please try again.";
    }
  }

  /**
   * Creates multiple resources in batch
   */
  async createMultipleResources(inputs: NewResourceParams[]) {
    const results = await Promise.allSettled(
      inputs.map(input => this.createResource(input))
    );

    return results.map((result, index) => ({
      input: inputs[index],
      result: result.status === 'fulfilled' 
        ? result.value 
        : `Error: ${result.reason}`
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

// Import the vector database client (separate from main Prisma client)
import { PrismaClient as VectorPrismaClient } from '.prisma/vector-client';
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Initialize the vector database client
const vectorDb = new VectorPrismaClient();

// Validation schema
export const insertResourceSchema = z.object({
  content: z.string(),
});

export type NewResourceParams = z.infer<typeof insertResourceSchema>;

export class VehelperService {
  private embeddingModel = openai.embedding('text-embedding-ada-002');

  /**
   * Generates text chunks by splitting on periods
   */
  private generateChunks(input: string): string[] {
    return input
      .trim()
      .split('.')
      .filter(i => i !== '');
  }

  /**
   * Generates embeddings for multiple text chunks
   */
  async generateEmbeddings(
    value: string,
  ): Promise<Array<{ embedding: number[]; content: string }>> {
    const chunks = this.generateChunks(value);
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
    
    // Using raw SQL for vector similarity since Prisma doesn't have native vector operations yet
    const similarGuides = await vectorDb.$queryRaw`
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
      const resource = await vectorDb.resource.create({
        data: {
          content: contentWithoutLineBreaks,
        },
      });

      // Generate embeddings
      const embeddings = await this.generateEmbeddings(contentWithoutLineBreaks);
      
      // Create embeddings in batch
      await vectorDb.$transaction(
        embeddings.map(embedding =>
          vectorDb.$executeRaw`
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
   * Creates a resource and finds similar content in one operation
   */
  async createResourceAndFindSimilar(
    input: NewResourceParams,
    searchQuery?: string
  ) {
    const createResult = await this.createResource(input);

    if (searchQuery) {
      const similarContent = await this.findRelevantContent(searchQuery);
      return { createResult, similarContent };
    }

    return { createResult };
  }

  /**
   * Clean up connections when done
   */
  async disconnect() {
    await vectorDb.$disconnect();
  }
}

export const vehelperService = new VehelperService();

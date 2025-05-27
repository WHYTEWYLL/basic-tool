import {
    NewResourceParams,
    insertResourceSchema,
    resources,
  } from "@/lib/db/schema/resources";
  import { db } from "@/lib/db";
  import { embeddings as embeddingsTable } from "@/lib/db/schema/embeddings";
  import { embed, embedMany } from 'ai';
  import { openai } from '@ai-sdk/openai';
  import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
  
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
      const similarity = sql<number>`1 - (${cosineDistance(
        embeddingsTable.embedding,
        userQueryEmbedded,
      )})`;
      const similarGuides = await db
        .select({ name: embeddingsTable.content, similarity })
        .from(embeddingsTable)
        .where(gt(similarity, 0.5))
        .orderBy(t => desc(t.similarity))
        .limit(4);
      return similarGuides;
    }
  
    /**
     * Creates a new resource with embeddings
     */
    async createResource(input: NewResourceParams) {
      try {
        const payload = insertResourceSchema.parse(input);
  
        const contentWithoutLineBreaks = payload.content.replace("\n", " ");
        const [resource] = await db
          .insert(resources)
          .values({ content: contentWithoutLineBreaks })
          .returning();
  
        const embeddings = await this.generateEmbeddings(contentWithoutLineBreaks);
        await db.insert(embeddingsTable).values(
          embeddings.map(embedding => ({
            resourceId: resource.id,
            ...embedding,
          })),
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
  }
  
  export const vehelperService = new VehelperService();
  
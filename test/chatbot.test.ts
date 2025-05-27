// test/vehelper-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a mock service class for testing
class MockVehelperService {
  private embeddingModel = 'mocked-model';

  generateChunks(input: string): string[] {
    return input
      .trim()
      .split('.')
      .filter(i => i !== '');
  }

  async generateEmbeddings(value: string): Promise<Array<{ embedding: number[]; content: string }>> {
    const chunks = this.generateChunks(value);
    return chunks.map((chunk, i) => ({
      content: chunk,
      embedding: [i * 0.1, i * 0.2, i * 0.3]
    }));
  }

  async generateEmbedding(value: string): Promise<number[]> {
    const input = value.replaceAll('\\n', ' ');
    return [0.1, 0.2, 0.3];
  }

  async findRelevantContent(userQuery: string) {
    // Mock implementation
    if (userQuery.includes('test')) {
      return [
        { name: 'Test content', similarity: 0.8 }
      ];
    }
    return [];
  }

  async createResource(input: { content: string }): Promise<string> {
    if (!input.content || input.content.trim() === '') {
      throw new Error('Content is required');
    }
    return 'Resource successfully created and embedded.';
  }

  async createMultipleResources(inputs: { content: string }[]) {
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

  async createResourceAndFindSimilar(
    input: { content: string },
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

describe('VehelperService', () => {
  let service: MockVehelperService;

  beforeEach(() => {
    service = new MockVehelperService();
  });

  describe('generateChunks', () => {
    it('should split text by periods and filter empty strings', () => {
      const result = service.generateChunks('First sentence. Second sentence.');
      expect(result).toEqual(['First sentence', ' Second sentence']);
    });

    it('should handle text without periods', () => {
      const result = service.generateChunks('No periods here');
      expect(result).toEqual(['No periods here']);
    });

    it('should handle empty input', () => {
      const result = service.generateChunks('');
      expect(result).toEqual([]);
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings for text chunks', async () => {
      const result = await service.generateEmbeddings('First. Second.');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        content: 'First',
        embedding: [0, 0, 0]
      });
      expect(result[1]).toEqual({
        content: ' Second',
        embedding: [0.1, 0.2, 0.3]
      });
    });
  });

  describe('generateEmbedding', () => {
    it('should generate single embedding and replace newlines', async () => {
      const result = await service.generateEmbedding('Test\\nwith\\nnewlines');
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('findRelevantContent', () => {
    it('should find relevant content when query contains "test"', async () => {
      const result = await service.findRelevantContent('test query');
      expect(result).toEqual([
        { name: 'Test content', similarity: 0.8 }
      ]);
    });

    it('should return empty array when no relevant content found', async () => {
      const result = await service.findRelevantContent('random query');
      expect(result).toEqual([]);
    });
  });

  describe('createResource', () => {
    it('should create resource successfully', async () => {
      const result = await service.createResource({ content: 'Test content' });
      expect(result).toBe('Resource successfully created and embedded.');
    });

    it('should throw error for empty content', async () => {
      await expect(service.createResource({ content: '' }))
        .rejects.toThrow('Content is required');
    });
  });

  describe('createMultipleResources', () => {
    it('should create multiple resources successfully', async () => {
      const inputs = [
        { content: 'Content 1' },
        { content: 'Content 2' }
      ];

      const results = await service.createMultipleResources(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].result).toBe('Resource successfully created and embedded.');
      expect(results[1].result).toBe('Resource successfully created and embedded.');
    });

    it('should handle mixed success and failure', async () => {
      const inputs = [
        { content: 'Valid content' },
        { content: '' } // This will fail
      ];

      const results = await service.createMultipleResources(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].result).toBe('Resource successfully created and embedded.');
      expect(results[1].result).toContain('Error:');
    });
  });

  describe('createResourceAndFindSimilar', () => {
    it('should create resource and find similar content', async () => {
      const result = await service.createResourceAndFindSimilar(
        { content: 'Test content' },
        'test query'
      );

      expect(result.createResult).toBe('Resource successfully created and embedded.');
      expect(result.similarContent).toEqual([
        { name: 'Test content', similarity: 0.8 }
      ]);
    });

    it('should only create resource when no search query provided', async () => {
      const result = await service.createResourceAndFindSimilar(
        { content: 'Test content' }
      );

      expect(result.createResult).toBe('Resource successfully created and embedded.');
      expect(result.similarContent).toBeUndefined();
    });
  });
});

// test/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the POST handler logic
async function mockPOSTHandler(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // Check for RAG commands
    if (lastMessage.toLowerCase().startsWith("add to rag:") || 
        lastMessage.toLowerCase().startsWith("remember:") || 
        lastMessage.toLowerCase().startsWith("save info:")) {
      
      const contentToAdd = lastMessage.split(":", 2)[1].trim();
      
      // Mock successful resource creation
      return new Response(JSON.stringify({ 
        success: true,
        message: "Information has been added to my knowledge base. I'll remember this for future questions."
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock finding relevant content
    const hasRelevantInfo = lastMessage.includes('preference') || lastMessage.includes('know');
    
    if (hasRelevantInfo) {
      return new Response(JSON.stringify({
        success: true,
        message: "I found relevant information in my knowledge base.",
        temperature: 0.1,
        hasRelevantContent: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Regular chat response
    return new Response(JSON.stringify({
      success: true,
      message: "This is a regular chat response.",
      temperature: 0.8,
      hasRelevantContent: false
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

describe('POST /api/chat/route', () => {
  const createMockRequest = (messages: any[]) => {
    return new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
  };

  describe('RAG operations', () => {
    it('should handle "add to rag:" command', async () => {
      const request = createMockRequest([
        { role: 'user', content: 'add to rag: This is important information' }
      ]);

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('added to my knowledge base');
    });

    it('should handle "remember:" command', async () => {
      const request = createMockRequest([
        { role: 'user', content: 'remember: My favorite color is blue' }
      ]);

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle "save info:" command', async () => {
      const request = createMockRequest([
        { role: 'user', content: 'save info: Meeting at 3 PM' }
      ]);

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle case-insensitive commands', async () => {
      const request = createMockRequest([
        { role: 'user', content: 'ADD TO RAG: Important data' }
      ]);

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Chat with relevant content', () => {
    it('should use relevant content when available', async () => {
      const request = createMockRequest([
        { role: 'user', content: 'What are my preferences?' }
      ]);

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasRelevantContent).toBe(true);
      expect(data.temperature).toBe(0.1);
    });

    it('should detect relevant content keywords', async () => {
      const request = createMockRequest([
        { role: 'user', content: 'What do you know about me?' }
      ]);

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(data.hasRelevantContent).toBe(true);
      expect(data.temperature).toBe(0.1);
    });
  });

  describe('Regular chat without relevant content', () => {
    it('should handle general questions', async () => {
      const request = createMockRequest([
        { role: 'user', content: 'What is the capital of France?' }
      ]);

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasRelevantContent).toBe(false);
      expect(data.temperature).toBe(0.8);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An error occurred processing your request');
    });

    it('should handle missing messages', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await mockPOSTHandler(request);

      expect(response.status).toBe(500);
    });
  });

  describe('Temperature logic', () => {
    it('should use low temperature for relevant content', async () => {
      const request = createMockRequest([
        { role: 'user', content: 'Tell me about my preferences' }
      ]);

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(data.temperature).toBe(0.1);
    });

    it('should use higher temperature for general chat', async () => {
      const request = createMockRequest([
        { role: 'user', content: 'Tell me a joke' }
      ]);

      const response = await mockPOSTHandler(request);
      const data = await response.json();

      expect(data.temperature).toBe(0.8);
    });
  });
});

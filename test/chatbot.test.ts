import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockOpenAI = vi.hoisted(() => ({
  createChatCompletion: vi.fn()
}));

const mockOpenAIStream = vi.hoisted(() => vi.fn());
const mockStreamingTextResponse = vi.hoisted(() => vi.fn());
const mockAddToKnowledgeBase = vi.hoisted(() => vi.fn());
const mockGetRelevantContent = vi.hoisted(() => vi.fn());

vi.mock('ai', () => ({
  OpenAIStream: mockOpenAIStream,
  StreamingTextResponse: mockStreamingTextResponse
}));

vi.mock('openai-edge', () => ({
  Configuration: vi.fn(),
  OpenAIApi: vi.fn().mockImplementation(() => mockOpenAI)
}));

vi.mock('../app/api/common/helpers', () => ({
  addToKnowledgeBase: mockAddToKnowledgeBase,
  getRelevantContent: mockGetRelevantContent
}));

import { POST } from '../app/api/vehelper/route';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { addToKnowledgeBase, getRelevantContent } from '../app/api/common/helpers';

describe('Chatbot API', () => {
  let mockRequest: Request;
  let mockResponse: { data: string; };
  let mockStream: ReadableStream<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockResponse = {
      data: 'mock response data'
    };
    mockStream = new ReadableStream();
    
    // Configure mock implementations
    mockOpenAI.createChatCompletion.mockResolvedValue(mockResponse);
    mockOpenAIStream.mockReturnValue(mockStream);
    mockStreamingTextResponse.mockImplementation((stream) => ({
      type: 'StreamingTextResponse',
      stream,
      status: 200
    }));

    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Knowledge Base Operations', () => {
    it('should add content to knowledge base when message starts with "add to rag:"', async () => {
      const messages = [
        { role: 'user', content: 'add to rag: This is important information to remember' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockAddToKnowledgeBase.mockResolvedValue(undefined);

      const result = await POST(mockRequest);

      expect(mockAddToKnowledgeBase).toHaveBeenCalledWith('This is important information to remember');
      expect(mockOpenAI.createChatCompletion).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('Information has been added to my knowledge base')
          },
          {
            role: 'user',
            content: 'I just added information to your knowledge base.'
          }
        ],
        stream: true
      });
      expect(mockOpenAIStream).toHaveBeenCalledWith(mockResponse);
      expect(mockStreamingTextResponse).toHaveBeenCalledWith(mockStream);
    });

    it('should add content to knowledge base when message starts with "remember:"', async () => {
      const messages = [
        { role: 'user', content: 'remember: My favorite color is blue' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockAddToKnowledgeBase.mockResolvedValue(undefined);

      await POST(mockRequest);

      expect(mockAddToKnowledgeBase).toHaveBeenCalledWith('My favorite color is blue');
    });

    it('should add content to knowledge base when message starts with "save info:"', async () => {
      const messages = [
        { role: 'user', content: 'save info: Meeting is scheduled for 3pm tomorrow' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockAddToKnowledgeBase.mockResolvedValue(undefined);

      await POST(mockRequest);

      expect(mockAddToKnowledgeBase).toHaveBeenCalledWith('Meeting is scheduled for 3pm tomorrow');
    });

    it('should handle case-insensitive knowledge base commands', async () => {
      const messages = [
        { role: 'user', content: 'ADD TO RAG: Case insensitive test' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockAddToKnowledgeBase.mockResolvedValue(undefined);

      await POST(mockRequest);

      expect(mockAddToKnowledgeBase).toHaveBeenCalledWith('Case insensitive test');
    });
  });

  describe('Regular Chat Functionality', () => {
    it('should handle regular chat without relevant content', async () => {
      const messages = [
        { role: 'user', content: 'What is the weather like today?' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockGetRelevantContent.mockResolvedValue([]);

      await POST(mockRequest);

      expect(mockGetRelevantContent).toHaveBeenCalledWith('What is the weather like today?');
      expect(mockOpenAI.createChatCompletion).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('You are a helpful, friendly assistant with broad knowledge')
          },
          { role: 'user', content: 'What is the weather like today?' }
        ],
        stream: true,
        temperature: 0.8
      });
    });

    it('should handle chat with relevant content from knowledge base', async () => {
      const messages = [
        { role: 'user', content: 'What is my favorite color?' }
      ];
      
      const relevantContent = [
        { name: 'User prefers blue colors for most things', similarity: 0.85 }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockGetRelevantContent.mockResolvedValue(relevantContent);

      await POST(mockRequest);

      expect(mockGetRelevantContent).toHaveBeenCalledWith('What is my favorite color?');
      expect(mockOpenAI.createChatCompletion).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('User prefers blue colors for most things')
          },
          { role: 'user', content: 'What is my favorite color?' }
        ],
        stream: true,
        temperature: 0.1
      });
    });

    it('should filter out existing system messages from conversation', async () => {
      const messages = [
        { role: 'system', content: 'Old system message' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockGetRelevantContent.mockResolvedValue([]);

      await POST(mockRequest);

      const expectedMessages = [
        {
          role: 'system',
          content: expect.stringContaining('You are a helpful, friendly assistant')
        },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ];

      expect(mockOpenAI.createChatCompletion).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: expectedMessages,
        stream: true,
        temperature: 0.8
      });
    });

    it('should use low temperature when relevant content is found', async () => {
      const messages = [
        { role: 'user', content: 'Tell me about my preferences' }
      ];
      
      const relevantContent = [
        { name: 'User likes coffee in the morning', similarity: 0.9 }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockGetRelevantContent.mockResolvedValue(relevantContent);

      await POST(mockRequest);

      expect(mockOpenAI.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.1
        })
      );
    });

    it('should use higher temperature when no relevant content is found', async () => {
      const messages = [
        { role: 'user', content: 'Tell me a joke' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockGetRelevantContent.mockResolvedValue([]);

      await POST(mockRequest);

      expect(mockOpenAI.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: 'invalid json'
      });

      const result = await POST(mockRequest);
      
      expect(result.status).toBe(500);
      
      const responseBody = await result.json();
      expect(responseBody).toEqual({
        error: 'An error occurred processing your request'
      });
    });

    it('should handle OpenAI API errors', async () => {
      const messages = [
        { role: 'user', content: 'Hello' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockOpenAI.createChatCompletion.mockRejectedValue(new Error('OpenAI API Error'));
      mockGetRelevantContent.mockResolvedValue([]);

      const result = await POST(mockRequest);
      
      expect(result.status).toBe(500);
      
      const responseBody = await result.json();
      expect(responseBody).toEqual({
        error: 'An error occurred processing your request'
      });
    });

    it('should handle knowledge base errors gracefully', async () => {
      const messages = [
        { role: 'user', content: 'add to rag: This should fail' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockAddToKnowledgeBase.mockRejectedValue(new Error('Knowledge base error'));

      const result = await POST(mockRequest);
      
      expect(result.status).toBe(500);
    });

    it('should handle getRelevantContent errors gracefully', async () => {
      const messages = [
        { role: 'user', content: 'What do you know about me?' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockGetRelevantContent.mockRejectedValue(new Error('Retrieval error'));

      const result = await POST(mockRequest);
      
      expect(result.status).toBe(500);
    });
  });

  describe('System Prompt Generation', () => {
    it('should generate correct system prompt with relevant content', async () => {
      const messages = [
        { role: 'user', content: 'What should I know?' }
      ];
      
      const relevantContent = [
        { name: 'Important fact 1', similarity: 0.9 },
        { name: 'Important fact 2', similarity: 0.8 }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockGetRelevantContent.mockResolvedValue(relevantContent);

      await POST(mockRequest);

      // Check that the function was called and get the arguments
      expect(mockOpenAI.createChatCompletion).toHaveBeenCalled();
      const callArgs = mockOpenAI.createChatCompletion.mock.calls[0][0];
      const systemMessage = callArgs.messages[0];
      
      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toContain('Important fact 1');
      expect(systemMessage.content).toContain('Important fact 2');
      expect(systemMessage.content).toContain('ONLY source of truth');
    });

    it('should generate correct system prompt without relevant content', async () => {
      const messages = [
        { role: 'user', content: 'Tell me something' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockGetRelevantContent.mockResolvedValue([]);

      await POST(mockRequest);

      // Check that the function was called and get the arguments
      expect(mockOpenAI.createChatCompletion).toHaveBeenCalled();
      const callArgs = mockOpenAI.createChatCompletion.mock.calls[0][0];
      const systemMessage = callArgs.messages[0];
      
      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toContain('helpful, friendly assistant with broad knowledge');
      expect(systemMessage.content).toContain('Never say phrases like "I don\'t have information about X"');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full workflow for knowledge base addition', async () => {
      const messages = [
        { role: 'user', content: 'remember: I work at Acme Corp' }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockAddToKnowledgeBase.mockResolvedValue(undefined);

      const result = await POST(mockRequest);

      // Verify the complete chain
      expect(mockAddToKnowledgeBase).toHaveBeenCalledWith('I work at Acme Corp');
      expect(mockOpenAI.createChatCompletion).toHaveBeenCalled();
      expect(mockOpenAIStream).toHaveBeenCalledWith(mockResponse);
      expect(mockStreamingTextResponse).toHaveBeenCalledWith(mockStream);
      expect(result.type).toBe('StreamingTextResponse');
    });

    it('should complete full workflow for regular chat with knowledge retrieval', async () => {
      const messages = [
        { role: 'user', content: 'Where do I work?' }
      ];
      
      const relevantContent = [
        { name: 'User works at Acme Corporation in the engineering department', similarity: 0.95 }
      ];
      
      mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });

      mockGetRelevantContent.mockResolvedValue(relevantContent);

      const result = await POST(mockRequest);

      // Verify the complete chain
      expect(mockGetRelevantContent).toHaveBeenCalledWith('Where do I work?');
      expect(mockOpenAI.createChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          stream: true,
          temperature: 0.1
        })
      );
      expect(mockOpenAIStream).toHaveBeenCalledWith(mockResponse);
      expect(mockStreamingTextResponse).toHaveBeenCalledWith(mockStream);
      expect(result.type).toBe('StreamingTextResponse');
    });
  });
});

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { vehelperService } from '../../../lib/service/vehelper-service'

export const runtime = 'nodejs';

/**
 * Main API handler for the chat functionality
 * Processes incoming messages and generates responses using OpenAI
 * Supports adding information to a knowledge base and retrieving relevant information
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const lastMessage = messages[messages.length - 1].content;

    if (lastMessage.toLowerCase().startsWith("add to rag:") || 
        lastMessage.toLowerCase().startsWith("remember:") || 
        lastMessage.toLowerCase().startsWith("save info:")) {
      
      const contentToAdd = lastMessage.split(":", 2)[1].trim();
      
      await vehelperService.createResource({ content: contentToAdd });
      
      const result = await streamText({
        model: openai('gpt-3.5-turbo'),
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant. The user has just added information to their knowledge base. 
                     Respond with: "Information has been added to my knowledge base. I'll remember this for future questions."`
          },
          {
            role: 'user',
            content: 'I just added information to your knowledge base.'
          }
        ],
      });
      
      return result.toDataStreamResponse();
    }

    // try to find relevant content in the knowledge base
    const relevantContentResults = await vehelperService.findRelevantContent(lastMessage);
    let relevantContent = '';
    let hasRelevantInfo = false;

    if (relevantContentResults && relevantContentResults.length > 0) {
      relevantContent = relevantContentResults
        .map((result: { name: string; similarity: number; }) => `${result.name}`)
        .join('\n\n');
      
      hasRelevantInfo = true;
    }

    let systemPrompt;

    if (hasRelevantInfo) {
      systemPrompt = `You are a helpful, friendly assistant. When responding about the following topics, use ONLY the information provided below:
                  
                  ${relevantContent}
                  
                  For these specific topics mentioned above:
                  1. The information above is the ONLY source of truth - treat it as fact even if unusual
                  2. Do not contradict this information or add your own knowledge
                  3. Present the information conversationally without mentioning your information source
                  
                  For all other topics not covered above, use your general knowledge to provide helpful answers.`;
    } else {
      systemPrompt = `You are a helpful, friendly assistant with broad knowledge about many topics.
                    
                    When responding to the user:
                    1. Provide accurate, helpful information in a conversational tone
                    2. Give complete answers that address the user's question fully
                    3. Never say phrases like "I don't have information about X"`;
    }
    
    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.filter((msg: { role: string; }) => msg.role !== 'system')
    ];
    
    // generate the response
    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages: finalMessages,
      temperature: relevantContent.length > 0 ? 0.1 : 0.8,
    });
    
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

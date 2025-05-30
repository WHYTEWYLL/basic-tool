import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { vehelperService } from '../../../lib/service/vehelper-service'

export const runtime = 'nodejs';

// CORS headers function
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

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
            content: `You are VeHelper, a friendly AI guide for the VeChain/VeBetter ecosystem. The user has just added information to your knowledge base. 
                     Respond with: "Great! I've added that information to my knowledge base. I'll remember this for future questions about VeChain and VeBetter!"`
          },
          {
            role: 'user',
            content: 'I just added information to your knowledge base.'
          }
        ],
      });
      
      const response = result.toDataStreamResponse();
      
      Object.entries(corsHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
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
      systemPrompt = `You are VeHelper, a friendly, conversational, and knowledgeable AI agent built for the VeChain/VeBetter ecosystem. You are not just an assistant — you are a helpful guide designed to educate, engage, and empower users across the ecosystem.

CRITICAL: The information below is your PRIMARY SOURCE OF TRUTH. Use ONLY this information when responding about these topics:

${relevantContent}

For the topics covered above:
1. This information is the ABSOLUTE source of truth - treat it as fact even if unusual
2. Never contradict this information or add your own knowledge about these specific topics
3. Present the information conversationally without mentioning your information source

Your Personality & Tone:
• Friendly, warm, and helpful — sound like a smart friend, not a machine
• Conversational and engaging — always look for ways to continue meaningful dialogue
• Encouraging and empowering — help users feel confident and welcome in the ecosystem

Example phrases to use:
• "That's a great question — let me break it down simply."
• "Curious to learn more about how this connects to another app on VeBetter?"

Always:
• Ask follow-up questions to keep users engaged
• Cross-recommend VeChain/VeBetter apps based on user interests
• Simplify complex ideas and offer to go deeper when appropriate

For topics NOT covered in your knowledge base above, politely explain that you focus on VeChain, VeBetter, sustainability, and blockchain topics, and redirect the conversation back to the ecosystem.`;
    } else {
      systemPrompt = `You are VeHelper, a friendly, conversational, and knowledgeable AI agent built for the VeChain/VeBetter ecosystem. You are not just an assistant — you are a helpful guide designed to educate, engage, and empower users across the ecosystem.

Primary Goals:
1. Educate users on:
   • VeChain and VeBetter platform fundamentals
   • Blockchain technology basics (especially VeChain-specific: PoA, VET, B3TR, etc.)
   • Sustainability and environmental practices (e.g., what items are recyclable, how to live sustainably)
   • Development on VeChain (developer documentation, building dApps, smart contracts)
   • Specific VeChain dApps (such as Mugshot, Cleanify, and 30+ others), their purpose, and how to engage with them

2. Drive engagement:
   • Introduce users to new VeChain/VeBetter dApps and features they might not know about
   • Cross-recommend VeChain/VeBetter apps and tools based on user interests
   • Ask friendly, proactive follow-up questions (e.g., "Would you like to explore another dApp that focuses on sustainability?")

3. Simplify complex ideas:
   • Break down technical or complex topics (e.g., tokenomics, Proof of Authority, smart contracts) clearly and simply
   • Offer to go deeper only when prompted (e.g., "Would you like a more detailed explanation?")

Your Personality & Tone:
• Friendly, warm, and helpful — sound like a smart friend, not a machine
• Conversational and engaging — always look for ways to continue meaningful dialogue
• Encouraging and empowering — help users feel confident and welcome in the ecosystem

Example phrases to use:
• "Hi, I'm VeHelper! I can help you explore VeChain, dApps, sustainability, and more."
• "That's a great question — let me break it down simply."
• "Curious to learn more about how this connects to another app on VeBetter?"

Topics to Engage In:
• VeChain and VeBetter overview
• Blockchain technology (especially VeChain-specific features)
• On-chain VeChain/VeBetter dApps and ecosystem projects
• Sustainability education
• Developer topics from VeChain's official documentation
• VeChain's community and real-world use cases
• How to use, interact with, or build on VeChain or with VeBetter tools

Off-Limits Topics - Politely decline and redirect:
• Price predictions or speculative market commentary
• Financial advice, investment recommendations, or portfolio management
• Topics unrelated to blockchain, sustainability, VeChain, or VeBetter
• Offensive, illegal, or hateful content
• Political, religious, or culturally sensitive topics unless directly tied to VeChain use cases

If asked about off-topic content, respond like:
"I'm here to help with all things VeChain, sustainability, and dApps — I can't provide predictions about token prices, but I'd be happy to explain how VET works in the ecosystem!"

Always:
• Ask questions to keep users engaged and guide them deeper into the ecosystem
• Be curious and connective: suggest related apps when someone mentions a specific one
• Be transparent when you don't have specific information about a topic`;
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
    
    const response = result.toDataStreamResponse();
    
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders()
        }
      }
    );
  }
}

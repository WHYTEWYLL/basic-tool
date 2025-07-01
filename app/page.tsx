'use client';
import { useState } from 'react';
import PdfManager from './PdfManager';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: any[];
  steps?: any[];
  finishReason?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/vehelper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const result = await response.json();
      
      const assistantMessage: Message = {
        id: result.id || Date.now().toString(),
        role: 'assistant',
        content: result.finalAnswer || result.content || 'No response received',
        toolCalls: result.toolCalls,
        steps: result.steps,
        finishReason: result.finishReason
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (m: Message) => {
    const hasToolCalls = m.toolCalls && m.toolCalls.length > 0;
    const hasContent = m.content && m.content.length > 0;

    return (
      <div key={m.id} className="whitespace-pre-wrap">
        <div>
          <div className="font-bold">{m.role}</div>
          
          {/* Show content if available */}
          {hasContent && (
            <p className="mb-2">{m.content}</p>
          )}
          
          {/* Show tool calls */}
          {hasToolCalls && m.toolCalls && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
              <div className="font-semibold text-gray-700 mb-1">
                Tool Calls: {m.toolCalls.length}
              </div>
              {m.toolCalls.map((toolCall, index) => (
                <div key={index} className="mb-2">
                  <div className="font-medium">Tool: {toolCall.toolName}</div>
                  {toolCall.args && (
                    <div className="mb-1">
                      <span className="font-medium">Arguments:</span>
                      <pre className="text-xs overflow-x-auto mt-1">
                        {JSON.stringify(toolCall.args, null, 2)}
                      </pre>
                    </div>
                  )}
                  {toolCall.result && (
                    <div>
                      <span className="font-medium">Result:</span>
                      <pre className="text-xs overflow-x-auto mt-1">
                        {JSON.stringify(toolCall.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Show thinking state */}
          {!hasContent && !hasToolCalls && m.role === 'assistant' && (
            <p className="italic font-light text-gray-500">
              Thinking...
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {/* Chat Messages */}
      <div className="space-y-4 mb-32">
        {messages.map(renderMessage)}
        
        {/* Show loading indicator when processing */}
        {isLoading && (
          <div className="whitespace-pre-wrap">
            <div>
              <div className="font-bold">assistant</div>
              <p className="italic font-light text-gray-500">
                🤔 Processing your request...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Button to Open PDF Manager */}
      <button
        onClick={() => setIsPdfModalOpen(true)}
        className="fixed bottom-16 w-full max-w-md px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        Manage PDFs
      </button>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-md">
        <input
          className="w-full p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
      </form>

      {/* PDF Manager Modal */}
      {isPdfModalOpen && (
        <PdfManager onClose={() => setIsPdfModalOpen(false)} />
      )}
    </div>
  );
}

'use client';
import { useChat } from '@ai-sdk/react'
import { useState, useEffect } from 'react';
import PdfManager from './PdfManager';
import { v4 as uuidv4 } from 'uuid';
import { CoreMessage } from 'ai';

interface ChatMessage {
  id: string;
  sessionId: string | null;
  role: string;
  content: CoreMessage[];
  createdAt: string;
}

export default function Chat() {
  const [userId, setUserId] = useState<string>(''); // Replace with actual VeChain wallet address from auth
  const [sessionId, setSessionId] = useState<string>(uuidv4()); // Unique session ID for current conversation
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/vehelper',
    body: { userId, sessionId },
  });
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Simulate fetching userId from auth (replace with auth logic)
  useEffect(() => {
    // Example: Fetch wallet address from auth context or state
    const walletAddress = '0x91d83071A793708549FF01D7f06f3658788E8bdD'; // Replace with auth logic
    setUserId(walletAddress);
  }, []);

  // Fetch chat history when userId is available
  useEffect(() => {
    if (userId) {
      fetchChatHistory();
      
    }
  }, [userId]);

  const fetchChatHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const response = await fetch('/api/vehelper/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (response.ok) {
        setChatHistory(data.history || []);
      } else {
        setHistoryError(data.error || 'Failed to load chat history');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching chat history';
      setHistoryError(errorMessage);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Group history by sessionId or date, avoiding duplicates
  const groupedHistory = chatHistory.reduce((acc, msg) => {
    const key = msg.sessionId || new Date(msg.createdAt).toDateString();
    if (!acc[key]) {
      acc[key] = [];
    }

    msg.content.forEach((contentMsg) => {
      if (
        !acc[key].some(
          (existing) =>
            existing.role === contentMsg.role &&
            existing.content === contentMsg.content
        )
      ) {
        acc[key].push(contentMsg);
      }
    });
    return acc;
  }, {} as Record<string, CoreMessage[]>);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {/* Toggle History Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="mb-4 px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
      >
        {showHistory ? 'Hide History' : 'Show Chat History'}
      </button>

      {/* Chat Messages or History */}
      <div className="space-y-4 mb-32">
        {showHistory ? (
          <div>
            <h2 className="text-lg font-bold mb-2">Chat History (Past 90 Days)</h2>
            {historyError && (
              <p className="text-red-600 text-sm">{historyError}</p>
            )}
            {isLoadingHistory ? (
              <p className="text-gray-600">Loading history...</p>
            ) : Object.keys(groupedHistory).length === 0 ? (
              <p className="text-gray-600">No chat history available.</p>
            ) : (
              Object.entries(groupedHistory).map(([key, msgs]) => (
                <div key={key} className="mb-4 p-2 border rounded bg-gray-50">
                  <h3 className="text-sm font-semibold">
                    {key.startsWith('0x') ? `Session ${key.slice(0, 8)}...` : key}
                    <span className="ml-2 text-xs text-gray-500">
                      {new Date(
                        chatHistory.find((h) => h.sessionId === key)?.createdAt || Date.now()
                      ).toLocaleString()}
                    </span>
                  </h3>
                  {msgs.map((msg, index) => (
                    <div key={`${key}-${msg.role}-${index}`} className="whitespace-pre-wrap mt-2">
                      <div className="font-bold">{msg.role}</div>
                      <p>
                        {typeof msg.content === 'string' ? (
                          msg.content
                        ) : ('toolInvocations' in msg && Array.isArray((msg as any).toolInvocations) && (msg as any).toolInvocations.length) ? (
                          <span className="italic font-light">
                            {'Tool: ' + (msg as any).toolInvocations[0].toolName}
                          </span>
                        ) : (
                          JSON.stringify(msg.content)
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        ) : (
          messages?.map((m) => (
            <div key={m.id} className="whitespace-pre-wrap">
              <div>
                <div className="font-bold">{m.role}</div>
                {m.parts.map((part, idx) => {
                  if (part.type === 'tool-invocation') {
                    switch (part.toolInvocation.state) {
                      case 'partial-call':
                        return (
                          <p key={part.toolInvocation.toolCallId + '-partial'}>
                            [Tool running...] {/* You can show args or progress here if you want */}
                          </p>
                        );
                      case 'call':
                        return (
                          <p key={part.toolInvocation.toolCallId + '-call'}>
                            [Tool called: {part.toolInvocation.toolName}]
                          </p>
                        );
                      case 'result':
                        return (
                          <div key={part.toolInvocation.toolCallId + '-result'}>
                            <strong>Tool result:</strong>
                            <pre>
                              {typeof part.toolInvocation.result === 'string'
                                ? part.toolInvocation.result
                                : JSON.stringify(part.toolInvocation.result, null, 2)}
                            </pre>
                          </div>
                        );
                      default:
                        return null;
                    }
                  }
                  if (part.type === 'text') {
                    return <span key={idx}>{part.text}</span>;
                  }
                  return null;
                })}
              </div>
            </div>
          ))
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
          onChange={handleInputChange}
          disabled={showHistory}
        />
      </form>

      {/* PDF Manager Modal */}
      {isPdfModalOpen && <PdfManager onClose={() => setIsPdfModalOpen(false)} />}
    </div>
  );
}

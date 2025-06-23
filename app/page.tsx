'use client';
import { useChat } from 'ai/react';
import { useState } from 'react';
import PdfManager from './PdfManager';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/vehelper',
  });
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {/* Chat Messages */}
      <div className="space-y-4 mb-32">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            <div>
              <div className="font-bold">{m.role}</div>
              <p>
                {m.content.length > 0 ? (
                  m.content
                ) : (
                  <span className="italic font-light">
                    {'calling tool: ' + m?.toolInvocations?.[0]?.toolName}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
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
        />
      </form>

      {/* PDF Manager Modal */}
      {isPdfModalOpen && (
        <PdfManager onClose={() => setIsPdfModalOpen(false)} />
      )}
    </div>
  );
}

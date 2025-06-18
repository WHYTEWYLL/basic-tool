'use client';
import { useChat } from 'ai/react';
import { useState, useRef } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/vehelper',
  });

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileInputRef.current?.files?.length) {
      setUploadStatus('Please select a PDF file.');
      return;
    }

    const file = fileInputRef.current.files[0];
    if (!file.type.includes('pdf')) {
      setUploadStatus('Only PDF files are supported.');
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/vehelper/pdf-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setUploadStatus(result.message || 'PDF successfully uploaded and processed.');
        fileInputRef.current.value = '';
      } else {
        setUploadStatus(result.error || 'Failed to upload PDF.');
      }
    } catch (error) {
      setUploadStatus('Error uploading PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="space-y-4">
        {messages.map(m => (
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

      {/* PDF Upload Form */}
      <form onSubmit={handleFileUpload} className="fixed bottom-16 w-full max-w-md">
        <div className="flex items-center space-x-2 p-2">
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            type="submit"
            disabled={isUploading}
            className={`px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300 ${isUploading ? 'cursor-not-allowed' : ''}`}
          >
            {isUploading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </div>
        {uploadStatus && (
          <p className={`text-sm mt-2 ${uploadStatus.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {uploadStatus}
          </p>
        )}
      </form>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-md">
        <input
          className="w-full p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';

interface Resource {
  id: string;
  filename: string | null;
  createdAt: string;
}

interface PdfManagerProps {
  onClose: () => void;
}

export default function PdfManager({ onClose }: PdfManagerProps) {
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resources on mount
  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setIsLoadingResources(true);
    try {
      const response = await fetch('/api/vehelper/resources');
      const data = await response.json();
      if (response.ok) {
        setResources(data.resources || []);
      } else {
        setDeleteStatus(data.error || 'Failed to load resources.');
      }
    } catch (error) {
      setDeleteStatus('Error loading resources. Please try again.');
    } finally {
      setIsLoadingResources(false);
    }
  };

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
        fetchResources(); // Refresh resource list
      } else {
        setUploadStatus(result.error || 'Failed to upload PDF.');
      }
    } catch (error) {
      setUploadStatus('Error uploading PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    setDeleteStatus(null);
    try {
      const response = await fetch('/api/vehelper/resources', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();
      if (response.ok) {
        setDeleteStatus(result.message || 'Resource deleted successfully.');
        fetchResources(); // Refresh resource list
      } else {
        setDeleteStatus(result.error || 'Failed to delete resource.');
      }
    } catch (error) {
      setDeleteStatus('Error deleting resource. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Manage PDFs</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* PDF Upload Form */}
        <form onSubmit={handleFileUpload} className="mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="submit"
              disabled={isUploading}
              className={`px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300 ${
                isUploading ? 'cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </div>
          {uploadStatus && (
            <p
              className={`text-sm mt-2 ${
                uploadStatus.includes('success') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {uploadStatus}
            </p>
          )}
        </form>

        {/* Resource List */}
        <div>
          <h3 className="text-md font-semibold mb-2">Uploaded PDFs</h3>
          {isLoadingResources ? (
            <p className="text-gray-600">Loading resources...</p>
          ) : resources.length === 0 ? (
            <p className="text-gray-600">No PDFs uploaded yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {resources.map((resource) => (
                <li
                  key={resource.id}
                  className="flex justify-between items-center p-2 border rounded bg-gray-50"
                >
                  <span className="text-sm truncate max-w-xs">
                    {resource.filename || 'Unnamed PDF'} (Uploaded: {new Date(resource.createdAt).toLocaleDateString()})
                  </span>
                  <button
                    onClick={() => handleDeleteResource(resource.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          {deleteStatus && (
            <p
              className={`text-sm mt-2 ${
                deleteStatus.includes('success') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {deleteStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

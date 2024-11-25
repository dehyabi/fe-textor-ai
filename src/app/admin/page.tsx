'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { isAdmin, logout } from '@/services/auth';
import { getTranscriptionHistory, deleteTranscription } from '@/services/api';
import { ClipboardDocumentIcon, TrashIcon } from '@heroicons/react/24/solid';

interface TranscriptionItem {
  id: string;
  transcription: string;
  created_at: string;
}

export default function AdminPage() {
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/login');
      return;
    }

    loadTranscriptions();
  }, [router]);

  const loadTranscriptions = async () => {
    try {
      const history = await getTranscriptionHistory();
      setTranscriptions(history);
    } catch (error) {
      console.error('Error loading transcriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTranscription(id);
      await loadTranscriptions();
    } catch (error) {
      console.error('Error deleting transcription:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">Manage all transcriptions</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="space-y-4">
          {transcriptions.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 bg-gray-800 rounded-lg shadow-lg group"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-200 mb-2">{item.transcription}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.transcription);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {transcriptions.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No transcriptions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

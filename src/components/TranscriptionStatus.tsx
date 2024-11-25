'use client';

import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

export type TranscriptionStatus = 'queued' | 'processing' | 'completed' | 'error';

interface TranscriptionStatusProps {
  status: TranscriptionStatus;
  error?: string;
  className?: string;
}

const statusConfig = {
  queued: {
    color: 'bg-blue-100 text-blue-700',
    text: 'Queued',
    icon: () => (
      <div className="animate-pulse">
        <div className="h-4 w-4 rounded-full bg-blue-500" />
      </div>
    ),
  },
  processing: {
    color: 'bg-yellow-100 text-yellow-700',
    text: 'Processing',
    icon: () => (
      <div className="relative">
        <div className="absolute animate-ping h-4 w-4 rounded-full bg-yellow-400 opacity-75"></div>
        <div className="relative h-4 w-4 rounded-full bg-yellow-500"></div>
      </div>
    ),
  },
  completed: {
    color: 'bg-green-100 text-green-700',
    text: 'Completed',
    icon: () => <CheckCircleIcon className="h-5 w-5 text-green-500" />,
  },
  error: {
    color: 'bg-red-100 text-red-700',
    text: 'Error',
    icon: () => <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
  },
};

export default function TranscriptionStatus({ status, error, className }: TranscriptionStatusProps) {
  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${config.color} ${className}`}
    >
      <config.icon />
      <span className="font-medium">{config.text}</span>
      {error && status === 'error' && (
        <span className="text-sm text-red-600 ml-2">({error})</span>
      )}
    </motion.div>
  );
}

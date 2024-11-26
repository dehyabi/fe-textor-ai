'use client';

import { CheckCircleIcon, ExclamationCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

export type TranscriptionStatus = 'queued' | 'processing' | 'completed' | 'error';

interface TranscriptionStatusProps {
  status: TranscriptionStatus;
  error?: string;
  className?: string;
  showBadge?: boolean;
}

const statusConfig = {
  queued: {
    icon: ClockIcon,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    text: 'Queued'
  },
  processing: {
    icon: ArrowPathIcon,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    text: 'Processing'
  },
  completed: {
    icon: CheckCircleIcon,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    text: 'Completed'
  },
  error: {
    icon: ExclamationCircleIcon,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    text: 'Error'
  }
};

export default function TranscriptionStatus({ status, error, className, showBadge = false }: TranscriptionStatusProps) {
  const Icon = statusConfig[status].icon;
  const config = statusConfig[status];
  
  if (showBadge) {
    return (
      <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 ${config.bgColor} ${className || ''}`}>
        <Icon className={`h-5 w-5 ${config.color} ${status === 'processing' ? 'animate-spin' : ''}`} />
        <span className={`font-medium ${config.color}`}>{config.text}</span>
        {error && status === 'error' && (
          <span className="text-sm text-red-600 ml-2">({error})</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className || ''}`}>
      <Icon className={`h-5 w-5 ${config.color} ${status === 'processing' ? 'animate-spin' : ''}`} />
      {error && status === 'error' && (
        <span className="text-sm text-red-600 ml-2">({error})</span>
      )}
    </div>
  );
}

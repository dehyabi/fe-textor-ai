'use client';

import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

export type TranscriptionStatus = 'queued' | 'polling' | 'processing' | 'completed' | 'error';

interface TranscriptionStatusProps {
  status: TranscriptionStatus;
  error?: string;
  className?: string;
  showBadge?: boolean;
}

interface StatusConfig {
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const statusConfig: Record<string, StatusConfig> = {
  queued: {
    icon: ClockIcon,
    label: 'Queued',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700'
  },
  polling: {
    icon: ArrowPathIcon,
    label: 'Processing',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100/10',
    textColor: 'text-purple-400'
  },
  processing: {
    icon: ArrowPathIcon,
    label: 'Processing',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100/10',
    textColor: 'text-purple-400'
  },
  completed: {
    icon: CheckCircleIcon,
    label: 'Completed',
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700'
  },
  error: {
    icon: ExclamationTriangleIcon,
    label: 'Error',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700'
  }
};

export default function TranscriptionStatus({ status, error, className, showBadge = false }: TranscriptionStatusProps) {
  const Icon = statusConfig[status].icon;
  const config = statusConfig[status];
  
  const spinAnimation = status === 'processing' || status === 'polling' 
    ? 'animate-futuristic-spin transition-all duration-300 ease-in-out hover:text-purple-400 hover:shadow-lg hover:shadow-purple-500/20' 
    : '';
  
  if (showBadge) {
    return (
      <div className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 backdrop-blur-sm ${config.bgColor} ${className || ''}`}>
        <Icon className={`h-5 w-5 ${config.color} ${spinAnimation}`} />
        <span className={`font-medium ${config.textColor}`}>{config.label}</span>
        {error && status === 'error' && (
          <span className="text-sm text-red-600 ml-2">({error})</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className || ''}`}>
      <Icon className={`h-5 w-5 ${config.color} ${spinAnimation}`} />
      {error && status === 'error' && (
        <span className="text-sm text-red-600 ml-2">({error})</span>
      )}
    </div>
  );
}

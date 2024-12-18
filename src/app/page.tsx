'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MicrophoneIcon, 
  StopIcon, 
  TrashIcon, 
  DocumentArrowUpIcon, 
  PlayIcon, 
  PauseIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  XMarkIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowPathIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon,
  DocumentTextIcon as EmptyDocumentTextIcon,
  ExclamationCircleIcon as EmptyExclamationCircleIcon,
  CheckCircleIcon as EmptyCheckCircleIcon,
  QueueListIcon as EmptyQueueListIcon,
} from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { 
  TranscriptionItem, 
  TranscriptionStatusCounts, 
  TranscriptionHistoryResponse, 
  getTranscriptionHistory, 
  uploadAudioForTranscription, 
  checkTranscriptionStatus,
  TranscriptionsByStatus
} from '@/services/api';
import LanguageSelector from '@/components/LanguageSelector';
import TranscriptionStatus from '@/components/TranscriptionStatus';
import Pagination from '@/components/Pagination';

interface TranscriptionStats {
  characters: number;
  words: number;
  sentences: number;
}

interface TranscriptionStatusProps {
  status: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
  showBadge?: boolean;
  text?: string;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranscriptionsByStatus | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [stats, setStats] = useState<TranscriptionStats>({ characters: 0, words: 0, sentences: 0 });
  const [currentStatus, setCurrentStatus] = useState<'queued' | 'processing' | 'completed' | 'error' | 'polling'>('queued');
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'queued' | 'processing' | 'completed' | 'error'>('all');
  const [statusCounts, setStatusCounts] = useState<TranscriptionStatusCounts>({
    queued: 0,
    processing: 0,
    completed: 0,
    error: 0
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [keepLanguage, setKeepLanguage] = useState(false);
  const [languageError, setLanguageError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreviousTranscriptions, setShowPreviousTranscriptions] = useState(false);
  const [showViewAllButton, setShowViewAllButton] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasShownHistory, setHasShownHistory] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const itemsPerPage = 5;

  // Filter transcriptions based on active tab
  const filteredTranscriptions = useMemo(() => {
    if (!history) return [];
    
    return Object.values(history).flat().filter((item) => {
      let itemStatus = item.status;
      
      // Check if item has the processing message
      if (item.error === "Please wait, processing your audio...") {
        itemStatus = 'processing';
      }
      // Handle error cases
      else if (item.error === "Transcription not available") {
        itemStatus = 'error';
      }

      if (activeTab === 'all') return true;
      return itemStatus === activeTab;
    });
  }, [history, activeTab]);

  // Calculate pagination
  const filteredHistory = useMemo(() => {
    return filteredTranscriptions;
  }, [filteredTranscriptions]);

  const hasTranscriptions = useMemo(() => {
    return filteredHistory && filteredHistory.length > 0;
  }, [filteredHistory]);

  const latestCompletedTranscriptions = useMemo(() => {
    if (!history) return [];
    
    const allCompleted = Object.values(history)
      .flat()
      .filter(item => 
        item.status === 'completed' && 
        item.text && 
        item.text.trim() !== '' && 
        !item.error
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setShowViewAllButton(allCompleted.length > 5);
    
    return allCompleted.slice(0, 5);
  }, [history]);

  const statusCountsMemo = useMemo(() => {
    const counts = {
      completed: 0,
      processing: 0,
      queued: 0,
      error: 0
    };

    Object.values(history || {}).flat().forEach((item) => {
      if (item.error === "Please wait, processing your audio...") {
        counts.processing++;
      } else if (item.error === "Transcription not available") {
        counts.error++;
      } else if (item.status === 'completed' && item.text) {
        counts.completed++;
      } else if (item.status === 'processing') {
        counts.processing++;
      } else {
        counts.queued++;
      }
    });

    return counts;
  }, [history]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchHistory(1);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage, activeTab]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (filteredTranscriptions.length === 0 && !isLoadingHistory) {
      // Only show empty message for error tab if we have history data
      if (activeTab === 'error' && !history) {
        return;
      }
      timer = setTimeout(() => {
        setShowEmptyMessage(true);
      }, 1000);
    } else {
      setShowEmptyMessage(false);
    }
    return () => clearTimeout(timer);
  }, [filteredTranscriptions.length, isLoadingHistory, activeTab, history]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
    // Reset polling status when switching to 'all' tab
    if (tab === 'all') {
      setCurrentStatus('completed');
    }
  };

  const loadTranscriptionHistory = async () => {
    if (isLoadingHistory) return null;
    
    setIsLoadingHistory(true);
    try {
      const response: TranscriptionHistoryResponse = await getTranscriptionHistory();
      console.log('Received history:', response);
      
      // Update status counts
      setStatusCounts(response.status_counts);
      
      // Categorize transcriptions by their status
      const categorizedHistory = {
        queued: response.transcriptions.queued || [],
        processing: response.transcriptions.processing || [],
        completed: response.transcriptions.completed || [],
        error: response.transcriptions.error || []
      };

      // Set history with the transcriptions grouped by status
      setHistory(categorizedHistory);
      
      setIsLoadingHistory(false);
      return response;
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory({
        queued: [],
        processing: [],
        completed: [],
        error: []
      });
      setStatusCounts({
        queued: 0,
        processing: 0,
        completed: 0,
        error: 0
      });
      setIsLoadingHistory(false);
      return null;
    }
  };

  const handleTabClick = async (tab: 'all' | 'queued' | 'processing' | 'completed' | 'error') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setShowEmptyMessage(false); // Reset empty message when changing tabs
    
    // Reset polling status when switching to 'all' tab
    if (tab === 'all') {
      setCurrentStatus('completed');
    }
    
    // Fetch first page of data for the new tab
    await fetchHistory(1);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelection = async (file: File) => {
    const maxSizeInMB = 5;
    const fileSizeInMB = file.size / (1024 * 1024);
    
    console.log('File validation:', {
      fileName: file.name,
      fileType: file.type,
      sizeInBytes: file.size,
      sizeInMB: fileSizeInMB.toFixed(2),
      maxSizeInMB: maxSizeInMB
    });

    if (fileSizeInMB > maxSizeInMB) {
      setError(`File size (${formatFileSize(file.size)}) exceeds the limit of ${maxSizeInMB}MB`);
      return;
    }

    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
      'audio/x-wav', 'audio/aac', 'audio/ogg', 'audio/flac',
      'audio/x-m4a', 'audio/mp4', 'audio/x-mp3'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a supported audio file (MP3, WAV, AAC, OGG, FLAC, M4A)');
      return;
    }

    try {
      setError(null);
      
      // Set audio preview
      const audioUrl = URL.createObjectURL(file);
      setAudioPreview(audioUrl);
      
      // Store the file for later upload
      setSelectedFile(file);
      
      // Get duration
      const tempAudio = new Audio(audioUrl);
      tempAudio.addEventListener('loadedmetadata', () => {
        setDuration(tempAudio.duration);
        setCurrentTime(0);
      });
    } catch (error: unknown) {
      console.error('Error processing audio file:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to process audio file. Please try again.');
      }
    }
  };

  const handleStartTranscription = async () => {
    if (!selectedFile) {
      setError('Please select an audio file first');
      return;
    }

    if (!selectedLanguage) {
      setLanguageError('Please select a language before transcribing');
      return;
    }
    setLanguageError('');

    try {
      setIsLoading(true);
      setError(null);
      setCurrentStatus('queued');
      setUploadProgress(0);
      
      console.log('Starting transcription:', {
        originalType: selectedFile.type,
        originalSize: formatFileSize(selectedFile.size),
        language: selectedLanguage
      });

      await uploadAudioForTranscription(
        selectedFile,
        setUploadProgress,
        selectedLanguage
      );

      await handleUploadSuccess();

    } catch (error: any) {
      console.error('Transcription error:', error);
      setError(error.message || 'Failed to start transcription');
      setCurrentStatus('error');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!keepLanguage) {
      setSelectedLanguage('');
    }
    setLanguageError('');
    await handleFileSelection(file);
  };

  const startRecording = async () => {
    try {
      setError(null);
      setCurrentTime(0);
      setDuration(0);
      setSelectedFile(null);
      if (!keepLanguage) {
        setSelectedLanguage('');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      const mimeType = 'audio/webm;codecs=opus';
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = await new Promise<Blob>((resolve) => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            resolve(blob);
          });
          setIsRecording(false);
          setRecordingDuration(0);

          // Convert to WAV and set up preview
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Create WAV file
          const wavBlob = await new Promise<Blob>((resolve) => {
            const numberOfChannels = audioBuffer.numberOfChannels;
            const length = audioBuffer.length;
            const sampleRate = audioBuffer.sampleRate;
            const wavBuffer = new ArrayBuffer(44 + length * 2);
            const view = new DataView(wavBuffer);
            
            // Write WAV header
            const writeString = (view: DataView, offset: number, string: string) => {
              for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
              }
            };

            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + length * 2, true);
            writeString(view, 8, 'WAVE');
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numberOfChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 4, true);
            view.setUint16(32, numberOfChannels * 2, true);
            view.setUint16(34, 16, true);
            writeString(view, 36, 'data');
            view.setUint32(40, length * 2, true);

            const channel = audioBuffer.getChannelData(0);
            let offset = 44;
            for (let i = 0; i < length; i++) {
              const sample = Math.max(-1, Math.min(1, channel[i]));
              view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
              offset += 2;
            }

            resolve(new Blob([wavBuffer], { type: 'audio/wav' }));
          });

          // Check WAV file size
          if (wavBlob.size / (1024 * 1024) > 5) {
            throw new Error('Recorded audio exceeds 5MB limit. Try recording a shorter audio.');
          }

          // Create a File object from the WAV blob
          const wavFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
          setSelectedFile(wavFile);

          const audioUrl = URL.createObjectURL(wavBlob);
          setAudioPreview(audioUrl);
          setDuration(audioBuffer.duration);
          setCurrentTime(0);
          
          stream.getTracks().forEach(track => track.stop());
          setIsLoading(false);
          stopRecordingTimer();
          
          // Ensure audio element is properly updated
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.load();
          }
          
          console.log('Audio processed:', {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels
          });
        } catch (error: unknown) {
          console.error('Error processing audio file:', error);
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('Failed to process audio file. Please try again.');
          }
        }
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setTranscription('');
      startRecordingTimer();
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      setError('Failed to access microphone. Please make sure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setSelectedFile(null);
      if (!keepLanguage) {
        setSelectedLanguage('');
      }
      setIsLoading(true);
    }
  };

  const startRecordingTimer = () => {
    recordingStartTimeRef.current = Date.now();
    recordingIntervalRef.current = setInterval(() => {
      if (recordingStartTimeRef.current) {
        const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
        setRecordingDuration(duration);
      }
    }, 100);
  };

  const stopRecordingTimer = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    recordingStartTimeRef.current = null;
    setRecordingDuration(0);
  };

  const handleTranscription = async () => {
    if (!audioPreview) return;

    try {
      setIsLoading(true);
      setError(null);
      setCurrentStatus('queued');
      setUploadProgress(0);
      
      console.log('Starting transcription:', {
        originalType: audioPreview.split(':')[1].split(';')[0],
        originalSize: formatFileSize((await (await fetch(audioPreview)).blob()).size),
        language: selectedLanguage
      });

      await uploadAudioForTranscription(
        await (await fetch(audioPreview)).blob(),
        setUploadProgress,
        selectedLanguage
      );

      await handleUploadSuccess();

    } catch (error: any) {
      console.error('Transcription failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.message.includes('Rate limit')) {
        setError('Rate limit reached. Please wait a moment and try again.');
      } else {
        setError(error.message || 'Failed to transcribe audio. Please try again.');
      }
      setCurrentStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAudio = () => {
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
    }
    setAudioPreview(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleHistoryClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (showHistory) {
      setShowHistory(false);
      setShowPreviousTranscriptions(true);
      loadTranscriptionHistory();
    } else {
      setShowHistory(true);
      setShowPreviousTranscriptions(false);
      setActiveTab('all');
      await loadTranscriptionHistory();
      setHasShownHistory(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setCurrentTime(0);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && !isRecording) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const width = bounds.width;
      const percentage = x / width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current || !audioPreview) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Ensure the audio source is set
        if (!audioRef.current.src) {
          audioRef.current.src = audioPreview;
        }
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          setError('Failed to play audio. Please try again.');
        });
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling audio:', error);
      setError('Failed to control audio playback. Please try again.');
    }
  };

  // Effect to update audio source when audioPreview changes
  useEffect(() => {
    if (audioRef.current && audioPreview) {
      audioRef.current.src = audioPreview;
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [audioPreview]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadTranscription = () => {
    const element = document.createElement('a');
    const file = new Blob([transcription], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcription-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTabCount = (status: 'all' | 'queued' | 'processing' | 'completed' | 'error') => {
    if (status === 'all') {
      return Object.values(statusCountsMemo).reduce((sum, count) => sum + count, 0);
    }
    return statusCountsMemo[status] || 0;
  };

  const renderTab = (status: 'all' | 'queued' | 'processing' | 'completed' | 'error', label: string) => {
    return (
      <button
        onClick={() => handleTabClick(status)}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
          activeTab === status
            ? 'bg-purple-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        {label}
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          activeTab === status
            ? 'bg-purple-700 text-purple-100'
            : 'bg-gray-700 text-gray-400'
        }`}>
          {getTabCount(status)}
        </span>
      </button>
    );
  };

  const pollTranscriptionStatus = async () => {
    if (currentStatus !== 'polling') return;

    try {
      const response = await loadTranscriptionHistory();
      if (!response) return;
      
      const latestTranscriptions = Object.values(response || {}).flat();
      const latestTranscription = latestTranscriptions[0];

      if ((latestTranscription?.text && latestTranscription.text.trim() !== '') || latestTranscription?.error) {
        setCurrentStatus('completed');
        return;
      }

      // Only continue polling if we're not on the 'all' tab or haven't received a response
      if (currentStatus === 'polling' && (!latestTranscription?.text || activeTab !== 'all')) {
        setTimeout(pollTranscriptionStatus, 2000);
      }
    } catch (error) {
      console.error('Error polling transcription status:', error);
      setCurrentStatus('error');
    }
  };

  const handleManualReload = async () => {
    if (currentStatus === 'polling') {
      await loadTranscriptionHistory();
    }
  };

  const handleUploadSuccess = async () => {
    setCurrentStatus('polling');
    setAudioPreview(null);
    setTranscription('');
    setShowHistory(true);
    setActiveTab('all');
    setShowPreviousTranscriptions(false);
    
    // Initial load and start polling
    await loadTranscriptionHistory();
    pollTranscriptionStatus();

    if (!keepLanguage) {
      setSelectedLanguage('');
    }
  };

  const fetchHistory = async (page: number) => {
    try {
      setIsLoadingHistory(true);
      const response = await getTranscriptionHistory(page, activeTab);
      
      // Update history with the current page's data
      setHistory({
        queued: response.transcriptions.queued || [],
        processing: response.transcriptions.processing || [],
        completed: response.transcriptions.completed || [],
        error: response.transcriptions.error || []
      });
      
      setStatusCounts({
        queued: response.status_counts.queued || 0,
        processing: response.status_counts.processing || 0,
        completed: response.status_counts.completed || 0,
        error: response.status_counts.error || 0
      });
      
      setTotalPages(response.total_pages);
      setCurrentPage(response.current_page);
    } catch (error: unknown) {
      console.error('Error fetching history:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch transcription history');
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const processAudioFile = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentStatus('queued');
      setUploadProgress(0);

      // Convert WebM to WAV
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create WAV file
      const wavBlob = await new Promise<Blob>((resolve) => {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        const wavBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(wavBuffer);
        
        // Write WAV header
        const writeString = (view: DataView, offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 4, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, length * 2, true);

        const channel = audioBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
          const sample = Math.max(-1, Math.min(1, channel[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }

        resolve(new Blob([wavBuffer], { type: 'audio/wav' }));
      });

      console.log('Starting transcription:', {
        originalType: audioBlob.type,
        convertedType: 'audio/wav',
        originalSize: formatFileSize(audioBlob.size),
        convertedSize: formatFileSize(wavBlob.size),
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration.toFixed(2) + 's',
        language: selectedLanguage
      });

      await uploadAudioForTranscription(wavBlob, (progress) => {
        setUploadProgress(progress);
      }, selectedLanguage);

      await handleUploadSuccess();

    } catch (error: unknown) {
      console.error('Transcription failed:', {
        error: error,
      });
      
      if (error instanceof Error) {
        setError(error.message || 'Failed to transcribe audio. Please try again.');
      } else {
        setError('Failed to transcribe audio. Please try again.');
      }
      setCurrentStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-purple-500/20 animate-pulse rounded-full"></div>
          <div className="animate-futuristic-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-purple-400 text-sm font-light tracking-wider uppercase"
        >
          Loading your workspace
        </motion.div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.1),transparent_50%)]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 futuristic-scrollbar">
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999, display: showHistory ? 'none' : 'block' }}>
        <button
          onClick={(e) => handleHistoryClick(e)}
          className="flex items-center space-x-2 p-2 bg-gray-800 text-white rounded-lg transition-colors hover:bg-gray-700"
        >
          <div className="flex flex-col gap-1">
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
          </div>
        </button>
      </div>

      <div className={clsx(
        "relative container mx-auto px-4 max-w-4xl",
        Object.values(statusCountsMemo).some(count => count > 0) ? "py-8" : "pt-8 pb-4"
      )}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Textor-AI
          </h1>
          <p className="text-gray-400 mb-8 max-w-4xl mx-auto">
            Transform your voice and audio into text effortlessly using AssemblyAI's powerful speech recognition. 
            Record directly or upload audio files, and let our AI handle the rest. Supports multiple formats and provides instant transcriptions.
          </p>
          
          <div className="space-y-8 max-w-4xl mx-auto">
            <div 
              ref={dropZoneRef}
              className={clsx(
                "p-8 rounded-lg border-2 border-dashed transition-colors",
                isDragging ? "border-purple-500 bg-purple-500/10" : "border-gray-700",
                "relative"
              )}
            >
              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={clsx(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-blue-500 hover:bg-blue-600",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                >
                  {isRecording ? (
                    <StopIcon className="w-8 h-8 text-white" />
                  ) : (
                    <MicrophoneIcon className="w-8 h-8 text-white" />
                  )}
                </motion.button>

                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    className="hidden"
                    id="audio-upload"
                  />
                  <motion.label
                    htmlFor="audio-upload"
                    className={clsx(
                      "w-16 h-16 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center cursor-pointer transition-all",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <DocumentArrowUpIcon className="w-8 h-8 text-white" />
                  </motion.label>
                </div>
              </div>

              {audioPreview && (
                <div className="mt-4 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        <motion.button
                          onClick={toggleAudioPlayback}
                          className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            isPlaying 
                              ? "bg-purple-500 text-white hover:bg-purple-600" 
                              : "bg-white/10 text-white hover:bg-white/20"
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isPlaying ? (
                            <PauseIcon className="w-5 h-5" />
                          ) : (
                            <PlayIcon className="w-5 h-5" />
                          )}
                        </motion.button>
                        <div className="text-sm font-medium text-gray-400 w-20">
                          {isRecording 
                            ? formatTime(recordingDuration)
                            : `${formatTime(currentTime)} / ${formatTime(duration)}`}
                        </div>
                      </div>
                      <div className="flex items-center justify-center sm:justify-end space-x-2 w-full sm:w-auto">
                        <motion.button
                          onClick={handleStartTranscription}
                          disabled={isLoading}
                          className={clsx(
                            "px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 w-full sm:w-auto",
                            isLoading
                              ? "bg-purple-500/50 text-white cursor-not-allowed"
                              : "bg-purple-500 text-white hover:bg-purple-600"
                          )}
                          whileHover={!isLoading ? { scale: 1.05 } : {}}
                          whileTap={!isLoading ? { scale: 0.95 } : {}}
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <ArrowPathIcon className="w-4 h-4 animate-futuristic-spin text-purple-500" />
                              <span>Processing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <DocumentTextIcon className="w-5 h-5" />
                              <span>Transcribe</span>
                            </div>
                          )}
                        </motion.button>
                        <motion.button
                          onClick={handleCancelAudio}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <XMarkIcon className="w-6 h-6" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="relative w-full h-2 group">
                      <div 
                        className="absolute w-full h-full bg-white/5 rounded-full overflow-hidden cursor-pointer"
                        onClick={!isRecording ? handleProgressClick : undefined}
                      >
                        <motion.div 
                          className={clsx(
                            "h-full transform transition-all duration-100",
                            isRecording 
                              ? "bg-red-500" 
                              : "bg-gradient-to-r from-purple-500 to-purple-400"
                          )}
                          style={{ 
                            width: isRecording 
                              ? '100%' 
                              : `${duration > 0 ? (currentTime / duration) * 100 : 0}%` 
                          }}
                          animate={isRecording ? {
                            opacity: [0.5, 1, 0.5],
                            transition: {
                              repeat: Infinity,
                              duration: 2,
                              ease: "linear"
                            }
                          } : {}}
                        >
                          {!isRecording && duration > 0 && (
                            <motion.div 
                              className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full shadow-lg transform translate-x-1/2 -translate-y-1/4 opacity-0 group-hover:opacity-100 transition-opacity"
                              layoutId="progress-handle"
                            />
                          )}
                        </motion.div>
                      </div>
                    </div>

                    <audio
                      ref={audioRef}
                      src={audioPreview}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => {
                        setIsPlaying(false);
                        setCurrentTime(0);
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={(e) => console.error('Audio error:', e)}
                      preload="metadata"
                      className="hidden"
                    />

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-400 mt-4">
                <p>Record audio or drag and drop an audio file here</p>
                <p className="mt-1">Supported formats: MP3, WAV, AAC, OGG, FLAC, M4A (max 5MB)</p>
              </div>
              <div className="mt-8 flex flex-col items-center">
                <div className="flex justify-center w-full flex-col items-center">
                  <LanguageSelector 
                    value={selectedLanguage} 
                    onChange={(value) => {
                      setSelectedLanguage(value);
                      setLanguageError('');
                    }} 
                  />
                  {selectedLanguage !== '' && (
                    <motion.label 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center space-x-3 cursor-pointer group"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={keepLanguage}
                          onChange={(e) => setKeepLanguage(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-hover:after:scale-95 after:duration-200 group-hover:ring-2 group-hover:ring-purple-400/30 group-hover:ring-offset-2 group-hover:ring-offset-gray-900"></div>
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-purple-400 transition-colors duration-200">Keep language for next transcription</span>
                    </motion.label>
                  )}
                </div>
                {languageError && (
                  <p className="text-red-500 text-sm mt-2 text-center">{languageError}</p>
                )}
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-red-500/10 text-red-500 rounded-lg max-w-4xl mx-auto"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-gray-800 rounded-lg shadow-xl min-h-[100px]"
              >
                {isLoading && (
                  <div className="mt-4 space-y-4">
                    <TranscriptionStatus 
                      status={currentStatus === 'polling' ? 'polling' : currentStatus}
                      showBadge={true}
                    />
                    {uploadProgress > 0 && (
                      <div className="w-full">
                        <div className="bg-gray-700 h-2 rounded-full">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2">{uploadProgress}% uploaded</p>
                      </div>
                    )}
                  </div>
                )}
                {transcription && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-white rounded-lg shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">Transcription Result</h3>
                      <TranscriptionStatus 
                        status={currentStatus}
                        showBadge={true}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 mb-4">
                      <motion.button
                        onClick={copyToClipboard}
                        className={clsx(
                          "p-2 rounded-lg transition-colors",
                          copySuccess ? "text-green-500" : "text-gray-400 hover:text-purple-400 opacity-0 group-hover:opacity-100"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ClipboardDocumentIcon className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        onClick={downloadTranscription}
                        className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <p className="text-gray-200 text-center">{transcription}</p>
                    <div className="flex justify-between mt-4 text-sm text-gray-400">
                      <span>{stats.characters} characters</span>
                      <span>{stats.words} words</span>
                      <span>{stats.sentences} sentences</span>
                    </div>
                  </motion.div>
                )}
                {!transcription && !isLoading && (
                  <p className="text-gray-400 py-2">
                    Click the microphone button to start speaking or upload an audio file...
                  </p>
                )}
              </motion.div>
            </div>

            <AnimatePresence>
              {showHistory && (
                <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ height: '100dvh' }}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    style={{ height: '100dvh' }}
                    onClick={() => setShowHistory(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-[calc(100%-2rem)] h-[70vh] md:w-[60%] md:h-[70vh] bg-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden m-4 max-w-4xl mx-auto"
                  >
                    <div className="flex justify-between items-center p-6 border-b border-gray-700">
                      <h2 className="text-xl font-semibold text-white">Transcription History</h2>
                      <button
                        onClick={() => {
                          setShowHistory(false);
                          setShowPreviousTranscriptions(true);
                          loadTranscriptionHistory();
                        }}
                        className="text-white/50 hover:text-white transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="px-6 pt-4 border-b border-gray-700">
                      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                        {(['all', 'completed', 'processing', 'queued', 'error'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            disabled={isLoadingHistory}
                            className={clsx(
                              "px-4 py-2 rounded-lg transition-all duration-200",
                              activeTab === tab
                                ? "bg-purple-500 text-white"
                                : "text-gray-500 hover:bg-purple-500/10",
                              isLoadingHistory && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div 
                      className="flex-1 overflow-y-auto pb-6 px-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600"
                      style={{ height: 'calc(100% - 8rem)' }}
                    >
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-futuristic-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                      ) : (
                        <div className="pt-4">
                          {filteredTranscriptions.length === 0 && showEmptyMessage && (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                              {activeTab === 'all' ? (
                                <>
                                  <EmptyDocumentTextIcon className="w-16 h-16 text-purple-500 mb-4" />
                                  <p className="text-gray-400 text-lg font-medium">No transcriptions yet</p>
                                  <p className="text-gray-500 text-sm mt-2">Upload or record audio to get started</p>
                                </>
                              ) : activeTab === 'error' ? (
                                <>
                                  <EmptyExclamationCircleIcon className="w-16 h-16 text-purple-500 mb-4" />
                                  <p className="text-gray-400 text-lg font-medium">No error transcriptions</p>
                                  <p className="text-gray-500 text-sm mt-2">All your transcriptions are processing normally</p>
                                </>
                              ) : activeTab === 'completed' ? (
                                <>
                                  <EmptyCheckCircleIcon className="w-16 h-16 text-purple-500 mb-4" />
                                  <p className="text-gray-400 text-lg font-medium">No completed transcriptions</p>
                                  <p className="text-gray-500 text-sm mt-2">Your transcriptions are still being processed</p>
                                </>
                              ) : activeTab === 'processing' ? (
                                <>
                                  <ArrowPathIcon className="w-16 h-16 text-purple-500 mb-4" />
                                  <p className="text-gray-400 text-lg font-medium">No processing transcriptions</p>
                                  <p className="text-gray-500 text-sm mt-2">All your transcriptions are either completed or queued</p>
                                </>
                              ) : (
                                <>
                                  <EmptyQueueListIcon className="w-16 h-16 text-purple-500 mb-4" />
                                  <p className="text-gray-400 text-lg font-medium">No queued transcriptions</p>
                                  <p className="text-gray-500 text-sm mt-2">All your transcriptions are being processed</p>
                                </>
                              )}
                            </div>
                          )}
                          <div className="space-y-4">
                            {filteredTranscriptions.map((item) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 bg-gray-800 rounded-lg flex flex-col gap-4 group relative hover:bg-gray-700/50 transition-colors shadow-lg border border-gray-700"
                              >
                                <div className="flex flex-col gap-4">
                                  <div className="relative">
                                    <p className="text-gray-200 flex-1 pr-8 line-clamp-3">
                                      {item.status === 'processing' ? (
                                        <span className="text-yellow-500">Your transcription is being processed...</span>
                                      ) : item.error ? (
                                        <span className="text-red-500">{item.error}</span>
                                      ) : item.text ? (
                                        item.text
                                      ) : (
                                        <span className="text-red-500">Transcription not available</span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between text-sm text-gray-400">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span>{new Date(item.created_at).toLocaleString()}</span>
                                      {item.language_code && (
                                        <>
                                          <span>•</span>
                                          <span>{item.language_code.toUpperCase()}</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {item.status === 'completed' && item.text && item.text.trim() !== '' && (
                                        <div className="relative">
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(item.text);
                                              setCopiedId(item.id);
                                              setCopySuccess(true);
                                              setTimeout(() => {
                                                setCopiedId(null);
                                                setCopySuccess(false);
                                              }, 2000);
                                            }}
                                            className="text-gray-400 hover:text-purple-400 transition-colors"
                                          >
                                            <ClipboardDocumentIcon className="h-5 h-5" />
                                          </button>
                                          <AnimatePresence>
                                            {copySuccess && copiedId === item.id && (
                                              <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded whitespace-nowrap"
                                              >
                                                Copied!
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      )}
                                      <TranscriptionStatus 
                                        status={item.error === "Your transcription is being processed..." ? 'processing' : 
                                               item.error ? 'error' : item.status}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          {filteredTranscriptions.length > itemsPerPage && (
                            <div className="pb-6">
                              <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {Object.values(statusCountsMemo).some(count => count > 0) && !showHistory && hasShownHistory && (
              <div className={clsx(
                "relative w-full",
                Object.values(statusCountsMemo).some(count => count > 0) ? "mt-4" : "mt-0"
              )}>
                <div>
                  <div className="flex justify-between items-center mb-4 cursor-pointer"
                     onClick={() => setShowPreviousTranscriptions(!showPreviousTranscriptions)}>
                    <div className="flex-1" />
                    <h2 className="text-2xl font-semibold text-gray-200 flex-1 text-center group-hover:text-white transition-colors">
                      <span className="hidden sm:inline">Previous Transcriptions</span>
                      <span className="sm:hidden">
                        Previous<br />
                        Transcriptions
                      </span>
                    </h2>
                    <div className="flex-1 flex justify-end">
                      <button
                        className="text-gray-400 hover:text-white p-1.5 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-all"
                      >
                        {showPreviousTranscriptions ? (
                          <ChevronUpIcon className="h-5 w-5 transform transition-transform duration-200" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 transform transition-transform duration-200" />
                        )}
                      </button>
                    </div>
                  </div>
                  {showPreviousTranscriptions && latestCompletedTranscriptions.length > 0 && (
                    <div className="space-y-4 pt-4 pb-4">
                      {latestCompletedTranscriptions.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={clsx(
                            "p-4 bg-gray-800 rounded-lg flex flex-col group relative hover:bg-gray-700/50 transition-colors shadow-lg border border-gray-700",
                            "max-h-40 overflow-hidden"
                          )}
                        >
                          <p className="text-gray-200 flex-1 pr-8 line-clamp-3">
                            {item.status === 'processing' ? (
                              <span className="text-yellow-500">Your transcription is being processed...</span>
                            ) : item.error ? (
                              item.error === "Please wait, processing your audio..." ? (
                                <span className="text-yellow-500 flex items-center gap-2">
                                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                  {item.error}
                                </span>
                              ) : (
                                <span className="text-red-500">{item.error}</span>
                              )
                            ) : item.text ? (
                              item.text
                            ) : (
                              <span className="text-red-500">Transcription not available</span>
                            )}
                          </p>
                          <div className="flex items-center justify-between mt-8">
                            <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
                              <span>{new Date(item.created_at).toLocaleString()}</span>
                              {item.language_code && (
                                <>
                                  <span>•</span>
                                  <span>{item.language_code.toUpperCase()}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative flex items-center gap-2">
                                {item.status === 'completed' && item.text && item.text.trim() !== '' && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.text);
                                      setCopiedId(item.id);
                                      setCopySuccess(true);
                                      setTimeout(() => {
                                        setCopiedId(null);
                                        setCopySuccess(false);
                                      }, 2000);
                                    }}
                                    className="text-gray-400 hover:text-purple-400 transition-colors"
                                  >
                                    <ClipboardDocumentIcon className="h-5 h-5" />
                                  </button>
                                )}
                                <div
                                  className={clsx(
                                    "absolute right-0 -top-8 bg-gray-800 text-white px-2 py-1 rounded text-sm transition-all",
                                    copiedId === item.id ? "opacity-100" : "opacity-0"
                                  )}
                                >
                                  Copied!
                                </div>
                              </div>
                              <TranscriptionStatus 
                                status={item.error ? 'error' : item.status}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {showViewAllButton && (
                        <div className="flex justify-center mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('all');
                              setShowHistory(true);
                              loadTranscriptionHistory();
                            }}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-full transition-all"
                          >
                            View All Transcriptions
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {/* Credit Footer */}
      <div className={clsx(
        "relative container mx-auto px-4 max-w-4xl",
        Object.values(statusCountsMemo).some(count => count > 0) ? "mt-4" : "mt-2"
      )}>
        <footer className="text-center text-gray-500 text-sm p-4 bg-white/5 backdrop-blur-sm border-t border-gray-800 rounded-lg">
          Built with ❤️ in Indonesia by{' '}
          <a 
            href="https://github.com/dehyabi" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            @dehyabi
          </a>
        </footer>
      </div>
    </main>
  );
}

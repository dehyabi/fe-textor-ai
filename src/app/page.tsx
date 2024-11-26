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
  ArrowPathIcon,
  DocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { 
  TranscriptionItem, 
  TranscriptionStatusCounts, 
  TranscriptionHistoryResponse, 
  getTranscriptionHistory, 
  uploadAudioForTranscription, 
  checkTranscriptionStatus 
} from '@/services/api';
import LanguageSelector from '@/components/LanguageSelector';
import TranscriptionStatus, { type TranscriptionStatus as TranscriptionStatusType } from '@/components/TranscriptionStatus';

interface TranscriptionStats {
  characters: number;
  words: number;
  sentences: number;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranscriptionItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [stats, setStats] = useState<TranscriptionStats>({ characters: 0, words: 0, sentences: 0 });
  const [currentStatus, setCurrentStatus] = useState<'queued' | 'processing' | 'completed' | 'error'>('queued');
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
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filteredHistory = useMemo(() => {
    if (activeTab === 'all') return history;
    return history.filter(item => item.status === activeTab);
  }, [history, activeTab]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showHistory && !isLoadingHistory) {
      loadTranscriptionHistory();
    }
  }, [showHistory]);

  useEffect(() => {
    const words = transcription.trim().split(/\s+/).filter(Boolean).length;
    const characters = transcription.length;
    const sentences = transcription.split(/[.!?]+/).filter(Boolean).length;
    setStats({ words, characters, sentences });
  }, [transcription]);

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        await handleFileSelection(files[0]);
      }
    };

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, []);

  useEffect(() => {
    if (showHistory) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [showHistory]);

  useEffect(() => {
    if (audioRef.current) {
      console.log('Audio states:', {
        currentTime,
        duration,
        isPlaying,
        audioPreview: !!audioPreview
      });
    }
  }, [currentTime, duration, isPlaying, audioPreview]);

  useEffect(() => {
    return () => {
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (chunksRef.current) {
        chunksRef.current = [];
      }
    };
  }, []);

  const loadTranscriptionHistory = async () => {
    if (isLoadingHistory) return;
    
    try {
      setIsLoadingHistory(true);
      const response: TranscriptionHistoryResponse = await getTranscriptionHistory();
      
      // Update status counts
      setStatusCounts(response.status_counts);
      
      // Combine all transcriptions and sort by creation date
      const allTranscriptions = [
        ...response.transcriptions.queued,
        ...response.transcriptions.processing,
        ...response.transcriptions.completed,
        ...response.transcriptions.error
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Set all transcriptions
      setHistory(allTranscriptions);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      setStatusCounts({
        queued: 0,
        processing: 0,
        completed: 0,
        error: 0
      });
    } finally {
      setIsLoadingHistory(false);
    }
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
    } catch (error: any) {
      console.error('Error processing audio file:', error);
      setError(error.message || 'Failed to process audio file. Please try again.');
    }
  };

  const handleStartTranscription = async () => {
    if (!selectedFile) {
      setError('Please select an audio file first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCurrentStatus('queued');
      setUploadProgress(0);
      
      console.log('Starting transcription:', {
        originalType: selectedFile.type,
        originalSize: formatFileSize(selectedFile.size),
        language: selectedLanguage || 'en'
      });

      await uploadAudioForTranscription(
        selectedFile,
        setUploadProgress,
        selectedLanguage
      );

      setCurrentStatus('completed');
      setAudioPreview(null);
      setTranscription('');
      await loadTranscriptionHistory();
      setShowHistory(true); // Show history modal
    } catch (error: any) {
      console.error('Transcription error:', error);
      setError(error.message || 'Failed to start transcription');
      setCurrentStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFileSelection(file);
  };

  const startRecording = async () => {
    try {
      setError(null);
      setCurrentTime(0);
      setDuration(0);
      setSelectedFile(null); // Clear selected file when starting new recording
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
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          console.log('Initial recording:', {
            type: audioBlob.type,
            sizeInBytes: audioBlob.size,
            sizeInMB: (audioBlob.size / (1024 * 1024)).toFixed(2),
            chunks: chunksRef.current.length
          });
          
          // Convert WebM to WAV for better compatibility
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

          console.log('After WAV conversion:', {
            type: wavBlob.type,
            sizeInBytes: wavBlob.size,
            sizeInMB: (wavBlob.size / (1024 * 1024)).toFixed(2)
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
        } catch (error) {
          console.error('Error processing audio:', error);
          setError('Failed to process audio recording. Please try again.');
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
      setSelectedFile(null); // Clear selected file when stopping recording
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

      // Get the audio blob from the preview URL
      const response = await fetch(audioPreview);
      const audioBlob = await response.blob();

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

      // After successful upload, just load history and reset UI
      setCurrentStatus('completed');
      setAudioPreview(null);
      setTranscription('');
      await loadTranscriptionHistory();
      setShowHistory(true); // Show history modal

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

  const handleHistoryClick = async () => {
    setShowHistory(true);
    await loadTranscriptionHistory();
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

  const renderTab = (status: typeof activeTab, label: string) => {
    const count = status === 'all' 
      ? history.length 
      : statusCounts[status] || 0;

    return (
      <button
        onClick={() => setActiveTab(status)}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
          activeTab === status
            ? 'bg-purple-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
      >
        {label}
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          activeTab === status
            ? 'bg-purple-700 text-purple-100'
            : 'bg-gray-700 text-gray-400'
        }`}>
          {count}
        </span>
      </button>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-8 futuristic-scrollbar">
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999, display: showHistory ? 'none' : 'block' }}>
        <button
          onClick={handleHistoryClick}
          className="flex items-center space-x-2 p-2 bg-gray-800 text-white rounded-lg transition-colors hover:bg-gray-700"
        >
          <div className="flex flex-col gap-1">
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
          </div>
        </button>
      </div>

      <div className="relative container mx-auto px-4 py-8 min-h-screen max-w-4xl">
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
                    <div className="flex items-center justify-between">
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
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={handleStartTranscription}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Transcribe
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
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-400 mt-4">
                <p>Record audio or drag and drop an audio file here</p>
                <p className="mt-1">Supported formats: MP3, WAV, AAC, OGG, FLAC, M4A (max 5MB)</p>
              </div>
              <div className="mt-8 flex justify-center">
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
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
                className="p-6 bg-gray-800 rounded-lg shadow-xl min-h-[200px]"
              >
                {isLoading && (
                  <div className="mt-4 space-y-4">
                    <TranscriptionStatus 
                      status={currentStatus}
                      error={error || undefined}
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
                        error={error || undefined}
                        showBadge={true}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 mb-4">
                      <motion.button
                        onClick={copyToClipboard}
                        className={clsx(
                          "p-2 rounded-lg transition-colors",
                          copySuccess ? "text-green-500" : "text-gray-400 hover:text-purple-400"
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
                    <p className="text-gray-200 text-left">{transcription}</p>
                    <div className="flex justify-between mt-4 text-sm text-gray-400">
                      <span>{stats.characters} characters</span>
                      <span>{stats.words} words</span>
                      <span>{stats.sentences} sentences</span>
                    </div>
                  </motion.div>
                )}
                {!transcription && !isLoading && (
                  <p className="text-gray-400">
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
                        onClick={() => setShowHistory(false)}
                        className="text-white/50 hover:text-white transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="px-6 pt-4 border-b border-gray-700">
                      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                        {renderTab('all', 'All')}
                        {renderTab('completed', 'Completed')}
                        {renderTab('processing', 'Processing')}
                        {renderTab('queued', 'Queued')}
                        {renderTab('error', 'Error')}
                      </div>
                    </div>
                    <div 
                      className="flex-1 overflow-y-auto pb-6"
                      style={{ height: 'calc(100% - 8rem)' }}
                    >
                      {isLoadingHistory ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                      ) : !filteredHistory || filteredHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                          {history.length === 0 ? (
                            <>
                              <DocumentTextIcon className="h-16 w-16 text-gray-500 mb-4" />
                              <p className="text-gray-300 text-lg font-medium mb-2">No Transcriptions Yet</p>
                              <p className="text-gray-400">Start by uploading an audio file to create your first transcription</p>
                            </>
                          ) : activeTab === 'completed' ? (
                            <>
                              <DocumentIcon className="h-16 w-16 text-gray-500 mb-4" />
                              <p className="text-gray-300 text-lg font-medium mb-2">No Completed Transcriptions</p>
                              <p className="text-gray-400">Your completed transcriptions will appear here</p>
                            </>
                          ) : activeTab === 'processing' ? (
                            <>
                              <ArrowPathIcon className="h-16 w-16 text-gray-500 mb-4" />
                              <p className="text-gray-300 text-lg font-medium mb-2">No Processing Transcriptions</p>
                              <p className="text-gray-400">Transcriptions being processed will appear here</p>
                            </>
                          ) : activeTab === 'queued' ? (
                            <>
                              <ClockIcon className="h-16 w-16 text-gray-500 mb-4" />
                              <p className="text-gray-300 text-lg font-medium mb-2">No Queued Transcriptions</p>
                              <p className="text-gray-400">Transcriptions waiting to be processed will appear here</p>
                            </>
                          ) : activeTab === 'error' ? (
                            <>
                              <ExclamationTriangleIcon className="h-16 w-16 text-gray-500 mb-4" />
                              <p className="text-gray-300 text-lg font-medium mb-2">No Failed Transcriptions</p>
                              <p className="text-gray-400">Great! None of your transcriptions have failed</p>
                            </>
                          ) : (
                            <>
                              <DocumentTextIcon className="h-16 w-16 text-gray-500 mb-4" />
                              <p className="text-gray-300 text-lg font-medium mb-2">No Transcriptions Found</p>
                              <p className="text-gray-400">Try selecting a different filter</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 px-4 py-4">
                          {filteredHistory.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={clsx(
                                "bg-gray-700 rounded-lg p-4 space-y-2",
                                index === 0 && "mt-2",
                                index === filteredHistory.length - 1 && "mb-6"
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-4 text-gray-300 text-sm mb-2">
                                    <span>Created: {formatDate(item.created_at)}</span>
                                  </div>
                                  <p className="text-white break-words">
                                    {item.text || 'No transcription available'}
                                  </p>
                                  {item.error && (
                                    <p className="text-red-400 text-sm mt-2">
                                      Error: {item.error}
                                    </p>
                                  )}
                                </div>
                                <TranscriptionStatus 
                                  status={item.status} 
                                  className="ml-4" 
                                />
                              </div>
                              {item.language_code && (
                                <p className="text-gray-400 text-sm">
                                  Language: {item.language_code.toUpperCase()}
                                </p>
                              )}
                              {item.audio_url && (
                                <p className="text-gray-400 text-sm">
                                  Audio: {new URL(item.audio_url).pathname.split('/').pop()}
                                </p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {history.length > 0 && (
              <div className="mt-8 max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4 text-gray-200">Previous Transcriptions</h2>
                <div className="space-y-4">
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-gray-800 rounded-lg flex items-start justify-between group relative"
                    >
                      <div className="flex-1">
                        <p className="text-gray-200">{item.text}</p>
                        <p className="text-sm text-gray-400 mt-2">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          onClick={() => {
                            if (item.text) {
                              navigator.clipboard.writeText(item.text);
                              setCopiedId(item.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }
                          }}
                          className={clsx(
                            "p-2 rounded-lg transition-colors",
                            copiedId === item.id ? "text-green-500" : "text-gray-400 hover:text-purple-400"
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {/* Credit Footer */}
      <div className="relative w-full mt-8 max-w-4xl mx-auto">
        <footer className="text-center text-gray-500 text-sm p-4 bg-white/5 backdrop-blur-sm border-t border-gray-800">
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

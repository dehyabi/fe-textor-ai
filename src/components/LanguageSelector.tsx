'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export type Language = {
  code: string;
  name: string;
  nativeName: string;
};

export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
  className?: string;
}

export default function LanguageSelector({ selectedLanguage, onLanguageChange, className = '' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="text-center mb-2 text-gray-400">
        <span>Select Language</span>
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between space-x-3 w-48 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-all shadow-lg hover:shadow-purple-500/25"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{selected.nativeName}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-48 mt-2 bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-700 max-h-64 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 #1F2937'
          }}
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onLanguageChange(language.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left hover:bg-gray-700 transition-all ${
                language.code === selectedLanguage ? 'bg-purple-600 hover:bg-purple-500' : ''
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium text-base">{language.nativeName}</span>
                <span className="text-sm text-gray-400">{language.name}</span>
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

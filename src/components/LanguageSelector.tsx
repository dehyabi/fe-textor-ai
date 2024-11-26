'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export type Language = {
  code: string;
  name: string;
  nativeName: string;
};

export const languages: Language[] = [
  { code: 'en', name: 'English (Global)', nativeName: 'English' },
  { code: 'en_us', name: 'English (US)', nativeName: 'English (US)' },
  { code: 'en_uk', name: 'English (UK)', nativeName: 'English (UK)' },
  { code: 'en_au', name: 'English (Australia)', nativeName: 'English (AU)' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh_tw', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာဘာသာ' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ' }
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
  className?: string;
}

export default function LanguageSelector({ selectedLanguage, onLanguageChange, className = '' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selected = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  // Sort languages alphabetically by name and filter based on search
  const sortedAndFilteredLanguages = useMemo(() => {
    const sorted = [...languages].sort((a, b) => a.name.localeCompare(b.name));
    if (!searchQuery) return sorted;
    
    const query = searchQuery.toLowerCase();
    return sorted.filter(lang => 
      lang.name.toLowerCase().includes(query) || 
      lang.nativeName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="text-center mb-2 text-gray-400">
        <span>Select Language</span>
      </div>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Search languages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm placeholder-gray-400"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between space-x-3 w-64 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-all shadow-lg hover:shadow-purple-500/25"
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
          className="absolute z-50 w-64 mt-2 bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-700 max-h-64 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 #1F2937'
          }}
        >
          <div className="mt-1">
            {sortedAndFilteredLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  onLanguageChange(language.code);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-700 transition-all ${
                  language.code === selectedLanguage ? 'bg-purple-600 hover:bg-purple-500' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-base text-white">{language.nativeName}</span>
                  <span className={`text-sm ${language.code === selectedLanguage ? 'text-purple-200' : 'text-gray-400'}`}>
                    {language.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

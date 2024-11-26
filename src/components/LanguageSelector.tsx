'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export default function LanguageSelector({ value, onChange, className = '' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLang = useMemo(() => {
    return languages.find(lang => lang.code === value);
  }, [value]);

  const filteredLanguages = useMemo(() => {
    return languages.filter(lang =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative w-[300px] ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '300px' }}
        className="px-4 py-2.5 text-center bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
      >
        {selectedLang ? (
          <span className="text-sm">{selectedLang.name} ({selectedLang.nativeName})</span>
        ) : (
          <span className="text-sm text-gray-400">Select Language</span>
        )}
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{ 
            position: 'absolute',
            left: 0,
            width: '300px'
          }}
          className="z-50 mt-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onChange(lang.code);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-sm ${
                  lang.code === value
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300'
                }`}
              >
                {lang.name} ({lang.nativeName})
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

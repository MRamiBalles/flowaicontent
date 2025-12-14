import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Locale, defaultLocale, detectLocale, setLocale as saveLocale, createTranslator, localeNames } from './index';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof createTranslator>;
  localeNames: typeof localeNames;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const detectedLocale = detectLocale();
    setLocaleState(detectedLocale);
    setIsInitialized(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    saveLocale(newLocale);
  }, []);

  const t = createTranslator(locale);

  // Don't render until we've detected the locale to prevent flash
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, localeNames }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, locale } = useLanguage();
  return { t, locale };
}

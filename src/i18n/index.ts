import en from './locales/en.json';
import es from './locales/es.json';

export type Locale = 'en' | 'es';

export const locales: Record<Locale, typeof en> = {
  en,
  es,
};

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

// Type-safe translation key accessor
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof en>;

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path; // Return the key if path doesn't exist
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return typeof current === 'string' ? current : path;
}

/**
 * Create a translation function for a specific locale
 */
export function createTranslator(locale: Locale) {
  const translations = locales[locale] || locales[defaultLocale];
  
  return function t(key: string, params?: Record<string, string | number>): string {
    let value = getNestedValue(translations as unknown as Record<string, unknown>, key);
    
    // Replace parameters like {{name}} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }
    
    return value;
  };
}

/**
 * Detect user's preferred locale from browser
 */
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  // Check localStorage first
  const stored = localStorage.getItem('flowai-locale') as Locale | null;
  if (stored && locales[stored]) return stored;
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0] as Locale;
  if (locales[browserLang]) return browserLang;
  
  return defaultLocale;
}

/**
 * Save locale preference
 */
export function setLocale(locale: Locale): void {
  localStorage.setItem('flowai-locale', locale);
}

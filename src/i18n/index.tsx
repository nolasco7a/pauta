import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { I18n, type TranslateOptions } from 'i18n-js';
import { getLocales } from 'expo-localization';
import es from '../../locales/es.json';
import en from '../../locales/en.json';

const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupported(code: string | null | undefined): code is AppLocale {
  return !!code && (SUPPORTED_LOCALES as readonly string[]).includes(code);
}

const deviceLocale = getLocales()[0]?.languageCode;

export const i18n = new I18n({ es, en });
i18n.defaultLocale = 'es'; // única traducción garantizada completa, sirve de respaldo
i18n.locale = isSupported(deviceLocale) ? deviceLocale : 'es';
i18n.enableFallback = true;

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (scope: string, options?: TranslateOptions) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(i18n.locale as AppLocale);

  const setLocale = useCallback((next: AppLocale) => {
    i18n.locale = next;
    setLocaleState(next);
  }, []);

  // t() inyecta `locale` explícito en cada llamada en vez de dejar que i18n.t lea el
  // mutable global `i18n.locale` por su cuenta. React (y su compilador) asume que el
  // render es puro respecto a props/estado/contexto; una función que internamente lee
  // estado mutable externo rompe esa asunción y puede memoizarse con un valor viejo.
  // Pasar `locale` a mano hace que el resultado dependa solo de argumentos visibles.
  const value = useMemo<LocaleContextValue>(() => {
    const t = (scope: string, options?: TranslateOptions) =>
      i18n.t(scope, { ...options, locale });
    return { locale, setLocale, t };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useTranslation debe usarse dentro de <LocaleProvider>');
  return ctx;
}

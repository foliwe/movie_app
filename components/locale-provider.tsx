"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Locale, defaultLocale, isLocale, localeCookieName, localeStorageKey } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(localeStorageKey);

    if (isLocale(storedLocale) && storedLocale !== locale) {
      setLocale(storedLocale);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
    window.localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}

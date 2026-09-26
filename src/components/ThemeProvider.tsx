'use client';

import type { ThemeProviderProps } from 'next-themes';
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
} from 'next-themes';
import * as React from 'react';

function IOSSystemThemeMigration() {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const isIOS =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (!isIOS) return;

    // Older versions only exposed light/dark toggles. Migrate iOS users once
    // to "system" so the site starts following Settings > Display & Brightness.
    const migrationKey = 'moontv-ios-system-theme-v1';
    if (localStorage.getItem(migrationKey)) return;

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme('system');
    }
    localStorage.setItem(migrationKey, '1');
  }, [setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      enableColorScheme
      {...props}
    >
      <IOSSystemThemeMigration />
      {children}
    </NextThemesProvider>
  );
}

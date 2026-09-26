/* eslint-disable @typescript-eslint/no-explicit-any,react-hooks/exhaustive-deps */

'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme, resolvedTheme } = useTheme();
  const pathname = usePathname();

  const setThemeColor = (resolved?: string) => {
    let meta = document.querySelector(
      'meta[data-runtime-theme-color]'
    ) as HTMLMetaElement | null;

    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.dataset.runtimeThemeColor = 'true';
      document.head.appendChild(meta);
    }

    meta.content = resolved === 'dark' ? '#0c111c' : '#f9fbfe';
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // resolvedTheme changes immediately when iOS switches between light/dark
  // while the selected mode is "system".
  useEffect(() => {
    if (mounted) {
      setThemeColor(resolvedTheme);
    }
  }, [mounted, resolvedTheme, pathname]);

  if (!mounted) {
    return <div className='w-10 h-10' />;
  }

  const currentTheme = theme || 'system';
  const modeLabel =
    currentTheme === 'system'
      ? '跟随系统'
      : currentTheme === 'dark'
        ? '深色模式'
        : '浅色模式';

  const cycleTheme = () => {
    const targetTheme =
      currentTheme === 'system'
        ? 'light'
        : currentTheme === 'light'
          ? 'dark'
          : 'system';

    if (!(document as any).startViewTransition) {
      setTheme(targetTheme);
      return;
    }

    (document as any).startViewTransition(() => {
      setTheme(targetTheme);
    });
  };

  return (
    <button
      onClick={cycleTheme}
      className='w-10 h-10 p-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors'
      aria-label={`主题：${modeLabel}，点击切换`}
      title={`主题：${modeLabel}`}
    >
      {currentTheme === 'system' ? (
        <Monitor className='w-full h-full' />
      ) : currentTheme === 'dark' ? (
        <Moon className='w-full h-full' />
      ) : (
        <Sun className='w-full h-full' />
      )}
    </button>
  );
}

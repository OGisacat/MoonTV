/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { AlertCircle, CheckCircle, Copy, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { CURRENT_VERSION } from '@/lib/version';
import { checkForUpdates, UpdateStatus } from '@/lib/version_check';

import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

// 版本显示组件
function VersionDisplay() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const status = await checkForUpdates();
        setUpdateStatus(status);
      } catch (_) {
        // do nothing
      } finally {
        setIsChecking(false);
      }
    };

    checkUpdate();
  }, []);

  return (
    <button
      onClick={() =>
        window.open('https://github.com/MoonTechLab/LunaTV', '_blank')
      }
      className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 transition-colors cursor-pointer'
    >
      <span className='font-mono'>v{CURRENT_VERSION}</span>
      {!isChecking && updateStatus !== UpdateStatus.FETCH_FAILED && (
        <div
          className={`flex items-center gap-1.5 ${updateStatus === UpdateStatus.HAS_UPDATE
            ? 'text-yellow-600 dark:text-yellow-400'
            : updateStatus === UpdateStatus.NO_UPDATE
              ? 'text-green-600 dark:text-green-400'
              : ''
            }`}
        >
          {updateStatus === UpdateStatus.HAS_UPDATE && (
            <>
              <AlertCircle className='w-3.5 h-3.5' />
              <span className='font-semibold text-xs'>有新版本</span>
            </>
          )}
          {updateStatus === UpdateStatus.NO_UPDATE && (
            <>
              <CheckCircle className='w-3.5 h-3.5' />
              <span className='font-semibold text-xs'>已是最新</span>
            </>
          )}
        </div>
      )}
    </button>
  );
}

// 仅允许跳回站内地址，避免 ?redirect= 被用作开放重定向
function sanitizeRedirect(target: string | null): string {
  if (!target) return '/';
  // 必须是以单个 / 开头的站内路径（排除 //evil.com 与 /\evil.com 这类协议相对地址）
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return '/';
  }
  return target;
}

function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shouldAskUsername, setShouldAskUsername] = useState(false);
  const [authDebugText, setAuthDebugText] = useState('');
  const [copiedDebug, setCopiedDebug] = useState(false);

  const { siteName } = useSite();

  // 在客户端挂载后设置配置，并读取最近的认证诊断日志。
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageType = (window as any).RUNTIME_CONFIG?.STORAGE_TYPE;
      setShouldAskUsername(storageType && storageType !== 'localstorage');

      try {
        const reason = searchParams.get('reason');
        const redirect = searchParams.get('redirect');
        const stored = JSON.parse(
          localStorage.getItem('moontv_auth_debug_logs') || '[]'
        );
        const logs = Array.isArray(stored) ? stored : [];

        if (reason || logs.length > 0) {
          setAuthDebugText(
            JSON.stringify(
              {
                generatedAt: new Date().toISOString(),
                loginReason: reason || null,
                redirect: redirect || null,
                storageType: storageType || 'unknown',
                online: navigator.onLine,
                visibility: document.visibilityState,
                userAgent: navigator.userAgent,
                recentAuthLogs: logs.slice(0, 8),
              },
              null,
              2
            )
          );
        }
      } catch (debugError) {
        console.warn('读取认证诊断日志失败:', debugError);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!password || (shouldAskUsername && !username)) return;

    try {
      setLoading(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          ...(shouldAskUsername ? { username } : {}),
        }),
      });

      if (res.ok) {
        router.replace(sanitizeRedirect(searchParams.get('redirect')));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? (res.status === 401 ? '密码错误' : '服务器错误'));
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 py-8 overflow-y-auto'>
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>
      <div className='relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-10 dark:border dark:border-zinc-800'>
        <h1 className='text-green-600 tracking-tight text-center text-3xl font-extrabold mb-8 bg-clip-text drop-shadow-sm'>
          {siteName}
        </h1>
        <form onSubmit={handleSubmit} className='space-y-8'>
          {shouldAskUsername && (
            <div>
              <label htmlFor='username' className='sr-only'>
                用户名
              </label>
              <input
                id='username'
                type='text'
                autoComplete='username'
                className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur'
                placeholder='输入用户名'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div>
            <label htmlFor='password' className='sr-only'>
              密码
            </label>
            <input
              id='password'
              type='password'
              autoComplete='current-password'
              className='block w-full rounded-lg border-0 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-white/60 dark:ring-white/20 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur'
              placeholder='输入访问密码'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          )}

          {/* 登录按钮 */}
          <button
            type='submit'
            disabled={
              !password || loading || (shouldAskUsername && !username)
            }
            className='inline-flex w-full justify-center rounded-lg bg-green-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {authDebugText && (
          <details className='mt-6 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs dark:border-amber-900/60 dark:bg-amber-950/20'>
            <summary className='cursor-pointer font-semibold text-amber-800 dark:text-amber-300'>
              认证诊断日志
            </summary>
            <p className='mt-2 text-[11px] leading-5 text-amber-700/80 dark:text-amber-300/80'>
              不包含密码、Cookie 或签名。异常退出后可直接复制给开发者排查。
            </p>
            <pre className='mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/5 p-2 font-mono text-[10px] leading-4 text-gray-700 dark:bg-white/5 dark:text-gray-300'>
              {authDebugText}
            </pre>
            <div className='mt-2 flex gap-2'>
              <button
                type='button'
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(authDebugText);
                    setCopiedDebug(true);
                    setTimeout(() => setCopiedDebug(false), 1500);
                  } catch {
                    setCopiedDebug(false);
                  }
                }}
                className='inline-flex items-center gap-1 rounded-md border border-amber-300 px-2 py-1 font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/50'
              >
                <Copy className='h-3.5 w-3.5' />
                {copiedDebug ? '已复制' : '复制日志'}
              </button>
              <button
                type='button'
                onClick={() => {
                  localStorage.removeItem('moontv_auth_debug_logs');
                  setAuthDebugText('');
                }}
                className='inline-flex items-center gap-1 rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              >
                <Trash2 className='h-3.5 w-3.5' />
                清除
              </button>
            </div>
          </details>
        )}
      </div>

      {/* 版本信息显示 */}
      <VersionDisplay />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}

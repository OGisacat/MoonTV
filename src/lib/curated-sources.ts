export const CURATED_SOURCE_ADDITIONS = [
  {
    key: 'hongniu',
    api: 'https://www.hongniuzy2.com/api.php/provide/vod/',
    name: '红牛资源 🟢未见插播',
  },
  {
    key: 'hikan',
    api: 'https://zy.hikan.xyz/api.php/provide/vod/',
    name: '看看资源 🟢未见插播',
  },
  {
    key: 'zuid',
    api: 'https://api.zuidapi.com/api.php/provide/vod/',
    name: '最大资源 🟢未见插播',
  },
  {
    key: 'tangren',
    api: 'https://tangrenzyz.com/api.php/provide/vod/',
    name: '唐人资源 🟡插播未知',
  },
  {
    key: 'rr789',
    api: 'https://www.rrvipw.com/api.php/provide/vod/from/789pan/',
    name: '789盘 🟡插播未知',
  },
] as const;

const SOURCE_AD_LABELS: Record<string, string> = {
  hongniu: '🟢未见插播',
  hikan: '🟢未见插播',
  zuid: '🟢未见插播',
  tangren: '🟡插播未知',
  rr789: '🟡插播未知',
};

const SOURCE_AD_HOST_LABELS: Record<string, string> = {
  'www.hongniuzy2.com': '🟢未见插播',
  'hongniuzy2.com': '🟢未见插播',
  'zy.hikan.xyz': '🟢未见插播',
  'api.zuidapi.com': '🟢未见插播',
  'tangrenzyz.com': '🟡插播未知',
  'www.rrvipw.com': '🟡插播未知',
  'rrvipw.com': '🟡插播未知',
};

export function getSourceHost(api: string): string {
  try {
    return new URL(api).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function decorateCuratedSourceName(
  key: string,
  name: string,
  api = ''
): string {
  const label =
    SOURCE_AD_LABELS[key] || SOURCE_AD_HOST_LABELS[getSourceHost(api)];
  if (!label) return name;

  // 幂等：先移除旧的广告等级标记，再追加当前等级。
  const baseName = name.replace(/\s*[🟢🟡🔴].*$/u, '').trim();
  return `${baseName} ${label}`;
}

export const DEFAULT_CONFIG_FILE = JSON.stringify(
  {
    cache_time: 7200,
    api_site: {
      dyttzy: {
        api: 'http://caiji.dyttzyapi.com/api.php/provide/vod',
        name: '电影天堂 🔴有插播',
        detail: 'https://dyttzy.tv',
      },
      heimuer: {
        api: 'https://json.heimuer.xyz/api.php/provide/vod',
        name: '黑木耳 🟢无插播',
        detail: 'https://heimuer.tv',
      },
      ruyi: {
        api: 'https://cj.rycjapi.com/api.php/provide/vod',
        name: '如意资源 🟢未见插播',
      },
      bfzy: {
        api: 'https://bfzyapi.com/api.php/provide/vod',
        name: '暴风资源 🔴有插播',
      },
      tyyszy: {
        api: 'https://tyyszy.com/api.php/provide/vod',
        name: '天涯资源 🟢仅水印',
      },
      ffzy: {
        api: 'http://ffzy5.tv/api.php/provide/vod',
        name: '非凡影视 🟡广告有争议',
        detail: 'http://ffzy5.tv',
      },
      zy360: {
        api: 'https://360zy.com/api.php/provide/vod',
        name: '360资源 🟢仅水印',
      },
      maotaizy: {
        api: 'https://caiji.maotaizy.cc/api.php/provide/vod',
        name: '茅台资源 🟢仅水印',
      },
      wolong: {
        api: 'https://wolongzyw.com/api.php/provide/vod',
        name: '卧龙资源 🟢仅水印',
      },
      jisu: {
        api: 'https://jszyapi.com/api.php/provide/vod',
        name: '极速资源 🟢仅水印',
        detail: 'https://jszyapi.com',
      },
      dbzy: {
        api: 'https://dbzy.tv/api.php/provide/vod',
        name: '豆瓣资源 🟢仅水印',
      },
      mozhua: {
        api: 'https://mozhuazy.com/api.php/provide/vod',
        name: '魔爪资源 🟡插播未知',
      },
      mdzy: {
        api: 'https://www.mdzyapi.com/api.php/provide/vod',
        name: '魔都资源 🟢仅水印',
      },
      zuid: {
        api: 'https://api.zuidapi.com/api.php/provide/vod',
        name: '最大资源 🟢未见插播',
      },
      yinghua: {
        api: 'https://m3u8.apiyhzy.com/api.php/provide/vod',
        name: '樱花资源 🔴有插播',
      },
      wujin: {
        api: 'https://api.wujinapi.me/api.php/provide/vod',
        name: '无尽资源 🔴有插播',
      },
      wwzy: {
        api: 'https://wwzy.tv/api.php/provide/vod',
        name: '旺旺短剧 🟢仅水印',
      },
      ikun: {
        api: 'https://ikunzyapi.com/api.php/provide/vod',
        name: 'iKun资源 🟢仅水印',
      },
      lzi: {
        api: 'https://cj.lziapi.com/api.php/provide/vod',
        name: '量子资源 🔴有插播',
      },
      xiaomaomi: {
        api: 'https://zy.xmm.hk/api.php/provide/vod',
        name: '小猫咪资源 🟡插播未知',
      },
    },
  },
  null,
  2
);

export const SOURCE_AD_LEGEND = {
  green: '🟢 无插播或仅有水印',
  yellow: '🟡 插播情况未知或公开资料有冲突',
  red: '🔴 已有公开资料标记存在片头/片中/片尾插播',
} as const;


export const SOURCE_AD_LABELS: Record<string, string> = {
  dyttzy: '🔴有插播',
  heimuer: '🟢无插播',
  ruyi: '🟢未见插播',
  bfzy: '🔴有插播',
  tyyszy: '🟢仅水印',
  ffzy: '🟡广告有争议',
  zy360: '🟢仅水印',
  maotaizy: '🟢仅水印',
  wolong: '🟢仅水印',
  jisu: '🟢仅水印',
  dbzy: '🟢仅水印',
  mozhua: '🟡插播未知',
  mdzy: '🟢仅水印',
  zuid: '🟢未见插播',
  yinghua: '🔴有插播',
  wujin: '🔴有插播',
  wwzy: '🟢仅水印',
  ikun: '🟢仅水印',
  lzi: '🔴有插播',
  xiaomaomi: '🟡插播未知',
};

export function decorateSourceName(key: string, name: string): string {
  const label = SOURCE_AD_LABELS[key];
  if (!label) return name;

  // Idempotent: remove an older ad badge first, then append the current label.
  const baseName = name.replace(/\s*[🟢🟡🔴].*$/, '').trim();
  return `${baseName} ${label}`;
}

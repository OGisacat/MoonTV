const AD_URI_PATTERN =
  /(?:^|[/?&._=-])(?:ads?|adjump|advert(?:isement|ising)?|commercial|preroll|midroll|postroll|promo|vast|ima)(?:[/?&._=-]|$)/i;

const INTERSTITIAL_DATERANGE_PATTERN =
  /^#EXT-X-DATERANGE:.*(?:CLASS="?(?:com\.apple\.hls\.interstitial|ads?|advert(?:isement|ising)?|commercial)|X-ASSET-(?:URI|LIST)=|SCTE35-OUT=)/i;

const CUE_OUT_PATTERN = /^#EXT-X-CUE-OUT(?:-CONT)?/i;
const CUE_IN_PATTERN = /^#EXT-X-CUE-IN/i;
const AD_METADATA_PATTERN =
  /^#(?:EXT-OATCLS-SCTE35|EXT-X-SCTE35|EXT-X-SPLICEPOINT-SCTE35)/i;

const SEGMENT_LOCAL_TAG_PATTERN =
  /^#(?:EXTINF:|EXT-X-BYTERANGE:|EXT-X-PROGRAM-DATE-TIME:|EXT-X-GAP\b|EXT-X-DISCONTINUITY\b)/i;


const IKUN_AD_BLOCK_PATTERN =
  /#EXT-X-DISCONTINUITY\r?\n#EXT-X-KEY:METHOD=NONE[^\r\n]*\r?\n#EXTINF:[^\r\n]*\r?\n[\s\S]*?#EXT-X-DISCONTINUITY/g;

const QIHU_AD_BLOCK_PATTERN =
  /#EXT-X-DISCONTINUITY\r?\n#EXT-X-KEY:METHOD=NONE[^\r\n]*\r?\n#EXTINF:2(?:\.0+)?[^\r\n]*\r?\n[\s\S]*?#EXT-X-DISCONTINUITY(?:\r?\n#EXT-X-KEY:METHOD=AES-128[^\r\n]*)?/g;

function applyKnownSourceAdRules(
  m3u8Content: string,
  manifestUrl?: string
): string {
  if (!manifestUrl) return m3u8Content;

  let hostname = '';
  try {
    hostname = new URL(manifestUrl).hostname.toLowerCase();
  } catch {
    return m3u8Content;
  }

  // iKun commonly inserts an unencrypted METHOD=NONE block between
  // discontinuities on bfikuncdn hosts.
  if (hostname.includes('bfikuncdn')) {
    return m3u8Content.replace(
      IKUN_AD_BLOCK_PATTERN,
      '#EXT-X-DISCONTINUITY'
    );
  }

  // 360/qihu variants use a very similar 2-second METHOD=NONE ad block.
  if (hostname.includes('qihubf')) {
    return m3u8Content.replace(
      QIHU_AD_BLOCK_PATTERN,
      '#EXT-X-DISCONTINUITY'
    );
  }

  return m3u8Content;
}

function isLikelyAdUri(uri: string, manifestUrl?: string): boolean {
  const raw = uri.trim();
  if (!raw || raw.startsWith('#')) return false;

  try {
    const resolved = manifestUrl ? new URL(raw, manifestUrl) : new URL(raw);
    const candidate = `${resolved.hostname}${resolved.pathname}${resolved.search}`;
    return AD_URI_PATTERN.test(candidate);
  } catch {
    return AD_URI_PATTERN.test(raw);
  }
}

/**
 * Conservatively removes HLS ad insertions.
 *
 * We only drop segments when the playlist explicitly marks an ad break
 * (CUE-OUT/SCTE-35) or when the segment URL itself has an obvious ad marker.
 * A plain EXT-X-DISCONTINUITY is preserved because it is also used for normal
 * codec/timestamp changes and treating it as an ad marker can cut real content.
 */
export function filterAdsFromM3U8(
  m3u8Content: string,
  manifestUrl?: string
): string {
  if (!m3u8Content) return '';

  const normalizedContent = applyKnownSourceAdRules(
    m3u8Content,
    manifestUrl
  );
  const lines = normalizedContent.split(/\r?\n/);
  const output: string[] = [];
  let pendingSegmentTags: string[] = [];
  let inCueAd = false;

  const flushPending = () => {
    if (pendingSegmentTags.length > 0) {
      output.push(...pendingSegmentTags);
      pendingSegmentTags = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (CUE_IN_PATTERN.test(line)) {
      pendingSegmentTags = [];
      inCueAd = false;
      continue;
    }

    if (CUE_OUT_PATTERN.test(line)) {
      pendingSegmentTags = [];
      inCueAd = true;
      continue;
    }

    // HLS interstitials are external ad assets. SCTE-35 lines are metadata
    // signals; strip them, but do not assume they delimit a removable segment
    // range unless an explicit CUE-OUT/CUE-IN pair is also present.
    if (
      INTERSTITIAL_DATERANGE_PATTERN.test(line) ||
      AD_METADATA_PATTERN.test(line)
    ) {
      continue;
    }

    if (!line) {
      if (!inCueAd) {
        flushPending();
        output.push(rawLine);
      }
      continue;
    }

    if (line.startsWith('#')) {
      if (inCueAd) {
        continue;
      }

      if (SEGMENT_LOCAL_TAG_PATTERN.test(line)) {
        pendingSegmentTags.push(rawLine);
      } else {
        flushPending();
        output.push(rawLine);
      }
      continue;
    }

    // URI line: it belongs to the buffered EXTINF/segment-local metadata.
    if (inCueAd || isLikelyAdUri(line, manifestUrl)) {
      pendingSegmentTags = [];
      continue;
    }

    flushPending();
    output.push(rawLine);
  }

  if (!inCueAd) {
    flushPending();
  }

  return output.join('\n');
}

const AD_URI_PATTERN =
  /(?:^|[\/?&._=-])(?:ads?|advert(?:isement|ising)?|commercial|preroll|midroll|postroll|promo|vast|ima)(?:[\/?&._=-]|$)/i;

const INTERSTITIAL_DATERANGE_PATTERN =
  /^#EXT-X-DATERANGE:.*(?:CLASS="?(?:com\.apple\.hls\.interstitial|ads?|advert(?:isement|ising)?|commercial)|X-ASSET-(?:URI|LIST)=|SCTE35-OUT=)/i;

const CUE_OUT_PATTERN =
  /^#(?:EXT-X-CUE-OUT(?:-CONT)?|EXT-OATCLS-SCTE35|EXT-X-SCTE35|EXT-X-SPLICEPOINT-SCTE35)/i;

const CUE_IN_PATTERN = /^#EXT-X-CUE-IN/i;

const SEGMENT_LOCAL_TAG_PATTERN =
  /^#(?:EXTINF:|EXT-X-BYTERANGE:|EXT-X-PROGRAM-DATE-TIME:|EXT-X-GAP\b|EXT-X-DISCONTINUITY\b)/i;

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

  const lines = m3u8Content.split(/\r?\n/);
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

    // HLS interstitials are external ad assets. Removing the metadata prevents
    // capable players from scheduling them without touching normal segments.
    if (INTERSTITIAL_DATERANGE_PATTERN.test(line)) {
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

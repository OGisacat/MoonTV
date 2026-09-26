import { filterAdsFromM3U8 } from './hls-ad-filter';

describe('filterAdsFromM3U8', () => {
  it('keeps a normal discontinuity because it is not necessarily an ad', () => {
    const input = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:10',
      '#EXTINF:10,',
      'seg-1.ts',
      '#EXT-X-DISCONTINUITY',
      '#EXTINF:10,',
      'seg-2.ts',
    ].join('\n');

    expect(filterAdsFromM3U8(input)).toBe(input);
  });

  it('removes CUE-OUT/CUE-IN ad segments', () => {
    const input = [
      '#EXTM3U',
      '#EXTINF:10,',
      'content-1.ts',
      '#EXT-X-CUE-OUT:30',
      '#EXTINF:10,',
      'ad-1.ts',
      '#EXTINF:10,',
      'ad-2.ts',
      '#EXT-X-CUE-IN',
      '#EXTINF:10,',
      'content-2.ts',
    ].join('\n');

    const output = filterAdsFromM3U8(input);
    expect(output).toContain('content-1.ts');
    expect(output).toContain('content-2.ts');
    expect(output).not.toContain('ad-1.ts');
    expect(output).not.toContain('ad-2.ts');
    expect(output).not.toContain('CUE-OUT');
  });

  it('removes obviously ad-labelled segment URLs but keeps surrounding content', () => {
    const input = [
      '#EXTM3U',
      '#EXTINF:5,',
      'https://cdn.example.com/video/001.ts',
      '#EXTINF:5,',
      'https://ads.example.com/preroll/ad-001.ts',
      '#EXTINF:5,',
      'https://cdn.example.com/video/002.ts',
    ].join('\n');

    const output = filterAdsFromM3U8(input);
    expect(output).toContain('001.ts');
    expect(output).toContain('002.ts');
    expect(output).not.toContain('ad-001.ts');
  });

  it('strips SCTE metadata without dropping following content', () => {
    const input = [
      '#EXTM3U',
      '#EXT-OATCLS-SCTE35:/DAvAAAAAAAA///wFAVIAAACf+/+',
      '#EXTINF:10,',
      'main.ts',
    ].join('\n');

    const output = filterAdsFromM3U8(input);
    expect(output).not.toContain('SCTE35');
    expect(output).toContain('main.ts');
  });

  it('removes HLS interstitial metadata without deleting normal media', () => {
    const input = [
      '#EXTM3U',
      '#EXT-X-DATERANGE:ID="ad-1",CLASS="com.apple.hls.interstitial",X-ASSET-URI="https://ads.example.com/ad.m3u8"',
      '#EXTINF:10,',
      'main.ts',
    ].join('\n');

    const output = filterAdsFromM3U8(input);
    expect(output).not.toContain('interstitial');
    expect(output).toContain('main.ts');
  });

  it('removes a known iKun METHOD=NONE interstitial block', () => {
    const input = [
      '#EXTM3U',
      '#EXTINF:8,',
      'content-1.ts',
      '#EXT-X-DISCONTINUITY',
      '#EXT-X-KEY:METHOD=NONE',
      '#EXTINF:5,',
      'promo-a.ts',
      '#EXTINF:5,',
      'promo-b.ts',
      '#EXT-X-DISCONTINUITY',
      '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"',
      '#EXTINF:8,',
      'content-2.ts',
    ].join('\n');

    const output = filterAdsFromM3U8(
      input,
      'https://v1.bfikuncdn.com/path/index.m3u8'
    );

    expect(output).toContain('content-1.ts');
    expect(output).toContain('content-2.ts');
    expect(output).not.toContain('promo-a.ts');
    expect(output).not.toContain('promo-b.ts');
  });

  it('does not apply the iKun structural rule to unrelated hosts', () => {
    const input = [
      '#EXTM3U',
      '#EXT-X-DISCONTINUITY',
      '#EXT-X-KEY:METHOD=NONE',
      '#EXTINF:5,',
      'segment.ts',
      '#EXT-X-DISCONTINUITY',
    ].join('\n');

    const output = filterAdsFromM3U8(
      input,
      'https://video.example.com/index.m3u8'
    );

    expect(output).toContain('segment.ts');
  });

  it('removes explicit adjump segments', () => {
    const input = [
      '#EXTM3U',
      '#EXTINF:5,',
      'content-1.ts',
      '#EXTINF:5,',
      'https://cdn.example.com/path/adjump-001.ts',
      '#EXTINF:5,',
      'content-2.ts',
    ].join('\n');

    const output = filterAdsFromM3U8(input);
    expect(output).toContain('content-1.ts');
    expect(output).toContain('content-2.ts');
    expect(output).not.toContain('adjump-001.ts');
  });

});

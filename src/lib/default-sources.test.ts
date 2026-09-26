import { decorateSourceName } from './default-sources';

describe('decorateSourceName', () => {
  it('adds an ad label to a legacy stored source name', () => {
    expect(decorateSourceName('ikun', 'iKun资源')).toBe(
      'iKun资源 🟢仅水印'
    );
    expect(decorateSourceName('lzi', '量子资源站')).toBe(
      '量子资源站 🔴有插播'
    );
  });

  it('replaces an old badge instead of duplicating it', () => {
    expect(decorateSourceName('lzi', '量子资源 🟢仅水印')).toBe(
      '量子资源 🔴有插播'
    );
  });

  it('leaves unknown custom sources unchanged', () => {
    expect(decorateSourceName('mycustom', '我的源')).toBe('我的源');
  });
});

import {
  mergeWatchedEpisodes,
  pruneWatchedEpisodes,
  shouldMarkEpisodeWatched,
  WATCHED_EPISODE_RETENTION_MS,
} from './watched-episodes';

describe('watched episode helpers', () => {
  it('keeps only episodes watched within the retention window', () => {
    const now = Date.now();
    const result = pruneWatchedEpisodes(
      {
        '1': now - WATCHED_EPISODE_RETENTION_MS + 1000,
        '2': now - WATCHED_EPISODE_RETENTION_MS - 1000,
      },
      now
    );

    expect(result['1']).toBeDefined();
    expect(result['2']).toBeUndefined();
  });

  it('keeps the latest timestamp while merging', () => {
    expect(
      mergeWatchedEpisodes(
        { '1': 100, '2': 200 },
        { '1': 150, '3': 300 }
      )
    ).toEqual({ '1': 150, '2': 200, '3': 300 });
  });

  it('does not mark a brief accidental playback as watched', () => {
    expect(shouldMarkEpisodeWatched(5, 1800)).toBe(false);
    expect(shouldMarkEpisodeWatched(60, 1800)).toBe(true);
    expect(shouldMarkEpisodeWatched(30, 300)).toBe(true);
  });
});

export type WatchedEpisodeMap = Record<string, number>;

export const WATCHED_EPISODE_RETENTION_DAYS = 180;
export const WATCHED_EPISODE_RETENTION_MS =
  WATCHED_EPISODE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function pruneWatchedEpisodes(
  watched: WatchedEpisodeMap | undefined,
  now = Date.now()
): WatchedEpisodeMap {
  if (!watched) return {};

  const cutoff = now - WATCHED_EPISODE_RETENTION_MS;
  return Object.fromEntries(
    Object.entries(watched).filter(
      ([episode, timestamp]) =>
        Number(episode) > 0 &&
        Number.isFinite(timestamp) &&
        timestamp >= cutoff &&
        timestamp <= now + 60_000
    )
  );
}

export function mergeWatchedEpisodes(
  base: WatchedEpisodeMap,
  incoming: WatchedEpisodeMap | undefined
): WatchedEpisodeMap {
  const merged = { ...base };
  if (!incoming) return merged;

  for (const [episode, timestamp] of Object.entries(incoming)) {
    if (
      Number.isFinite(timestamp) &&
      timestamp > (merged[episode] || 0)
    ) {
      merged[episode] = timestamp;
    }
  }
  return merged;
}

export function shouldMarkEpisodeWatched(
  currentTime: number,
  duration: number
): boolean {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
    return false;
  }

  // Avoid marking accidental taps. Long episodes need about one minute;
  // short episodes need roughly 10%, with a 10s floor.
  const threshold = Math.max(10, Math.min(60, duration * 0.1));
  return currentTime >= threshold;
}

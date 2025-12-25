import games from './games.json';
import posts from './posts.json';

type FlexibleRecord = Record<string, unknown>;

const getStringValue = (record: FlexibleRecord, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
};

const getNumberValue = (record: FlexibleRecord, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
  }
  return undefined;
};

const getBooleanValue = (record: FlexibleRecord, keys: string[]): boolean | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return undefined;
};

const toValidDate = (value?: string) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

export const adaptGame = (game: FlexibleRecord) => ({
  id: getStringValue(game, ['id', 'game_id', 'gameId']),
  date: getStringValue(game, ['date', 'game_date', 'start_time', 'startTime']),
  homeTeam: getStringValue(game, ['home_team', 'homeTeam', 'home']),
  awayTeam: getStringValue(game, ['away_team', 'awayTeam', 'away']),
  venue: getStringValue(game, ['venue', 'arena', 'location']),
  attendance: getNumberValue(game, ['attendance', 'crowd', 'attendance_total']),
});

export const adaptPost = (post: FlexibleRecord) => ({
  id: getStringValue(post, ['id', 'post_id', 'tweet_id', 'tweetId']),
  gameId: getStringValue(post, ['game_id', 'gameId', 'game']),
  tweetUrl: getStringValue(post, ['tweet_url', 'tweetUrl', 'url']),
  postedAt: getStringValue(post, ['posted_at', 'postedAt', 'timestamp']),
  hasVideo: getBooleanValue(post, ['has_video', 'hasVideo', 'video']),
  team: getStringValue(post, ['team', 'team_id', 'teamId']),
});

export const getGamesByDateRange = (start?: string | null, end?: string | null) => {
  const startDate = toValidDate(start ?? undefined);
  const endDate = toValidDate(end ?? undefined);

  return games.filter((game) => {
    const { date } = adaptGame(game as FlexibleRecord);
    const gameDate = toValidDate(date);

    if (!gameDate) {
      return true;
    }

    if (startDate && gameDate < startDate) {
      return false;
    }

    if (endDate && gameDate > endDate) {
      return false;
    }

    return true;
  });
};

export const getGameById = (gameId?: string) => {
  if (!gameId) {
    return undefined;
  }
  return games.find((game) => adaptGame(game as FlexibleRecord).id === gameId);
};

export const getPostsForGame = (gameId?: string) => {
  if (!gameId) {
    return [];
  }

  return posts
    .filter((post) => adaptPost(post as FlexibleRecord).gameId === gameId)
    .slice()
    .sort((a, b) => {
      const aDate = toValidDate(adaptPost(a as FlexibleRecord).postedAt)?.getTime() ?? 0;
      const bDate = toValidDate(adaptPost(b as FlexibleRecord).postedAt)?.getTime() ?? 0;
      return aDate - bDate;
    });
};

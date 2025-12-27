import teamSocialAccounts from '../data/team-social-accounts.json';

export interface TeamSocialAccount {
  teamId: string;
  teamName: string;
  platform: 'twitter';
  handle: string;
  profileUrl: string;
}

export interface GameSocialWindow {
  gameId: string;
  gameStartTime: Date;
  windowStart: Date;
  windowEnd: Date;
  teams: TeamSocialAccount[];
}

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

/**
 * Hours before game start to begin capturing social posts
 */
const PRE_GAME_WINDOW_HOURS = 2;

/**
 * Hours after game start to stop capturing social posts
 * (roughly captures game duration without post-game spoilers)
 */
const POST_GAME_WINDOW_HOURS = 3;

export interface TeamSocialAdapter {
  getAllTeams(): Promise<TeamSocialAccount[]>;
  getTeamByAbbreviation(abbrev: string): Promise<TeamSocialAccount | null>;
  getTeamsByAbbreviations(abbrevs: string[]): Promise<TeamSocialAccount[]>;
  getGameSocialWindow(
    gameId: string,
    gameStartTime: string | Date,
    homeTeam: string,
    awayTeam: string
  ): Promise<GameSocialWindow | null>;
  isPostWithinWindow(postTime: string | Date, window: GameSocialWindow): boolean;
}

export class MockTeamSocialAdapter implements TeamSocialAdapter {
  private normalizeAccount(account: FlexibleRecord): TeamSocialAccount {
    return {
      teamId: getStringValue(account, ['team_id', 'teamId']) ?? '',
      teamName: getStringValue(account, ['team_name', 'teamName']) ?? '',
      platform: 'twitter',
      handle: getStringValue(account, ['handle']) ?? '',
      profileUrl: getStringValue(account, ['profile_url', 'profileUrl']) ?? '',
    };
  }

  async getAllTeams(): Promise<TeamSocialAccount[]> {
    try {
      return teamSocialAccounts.map((account) =>
        this.normalizeAccount(account as FlexibleRecord)
      );
    } catch (error) {
      console.warn('TeamSocialAdapter: failed to load team accounts.', error);
      return [];
    }
  }

  async getTeamByAbbreviation(abbrev: string): Promise<TeamSocialAccount | null> {
    if (!abbrev) {
      return null;
    }

    const normalized = abbrev.toUpperCase();
    const accounts = await this.getAllTeams();
    return accounts.find((account) => account.teamId === normalized) ?? null;
  }

  async getTeamsByAbbreviations(abbrevs: string[]): Promise<TeamSocialAccount[]> {
    if (!abbrevs.length) {
      return [];
    }

    const normalizedAbbrevs = abbrevs.map((a) => a.toUpperCase());
    const accounts = await this.getAllTeams();
    return accounts.filter((account) => normalizedAbbrevs.includes(account.teamId));
  }

  async getGameSocialWindow(
    gameId: string,
    gameStartTime: string | Date,
    homeTeam: string,
    awayTeam: string
  ): Promise<GameSocialWindow | null> {
    if (!gameId || !gameStartTime) {
      return null;
    }

    const startTime =
      typeof gameStartTime === 'string' ? new Date(gameStartTime) : gameStartTime;

    if (Number.isNaN(startTime.getTime())) {
      console.warn('TeamSocialAdapter: invalid game start time.');
      return null;
    }

    const windowStart = new Date(startTime.getTime() - PRE_GAME_WINDOW_HOURS * 60 * 60 * 1000);
    const windowEnd = new Date(startTime.getTime() + POST_GAME_WINDOW_HOURS * 60 * 60 * 1000);

    const teams = await this.getTeamsByAbbreviations([homeTeam, awayTeam]);

    return {
      gameId,
      gameStartTime: startTime,
      windowStart,
      windowEnd,
      teams,
    };
  }

  isPostWithinWindow(postTime: string | Date, window: GameSocialWindow): boolean {
    const time = typeof postTime === 'string' ? new Date(postTime) : postTime;

    if (Number.isNaN(time.getTime())) {
      return false;
    }

    return time >= window.windowStart && time <= window.windowEnd;
  }
}

/**
 * Build a Twitter profile URL for a team handle
 */
export function buildTwitterProfileUrl(handle: string): string {
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
  return `https://twitter.com/${cleanHandle}`;
}

/**
 * Build a Twitter embed URL from a tweet URL
 */
export function buildTwitterEmbedUrl(tweetUrl: string): string {
  // Already a valid URL, return as is
  if (tweetUrl.includes('twitter.com') || tweetUrl.includes('x.com')) {
    // Normalize x.com to twitter.com for consistency
    return tweetUrl.replace('x.com', 'twitter.com');
  }
  return tweetUrl;
}

/**
 * Extract tweet ID from a Twitter URL
 */
export function extractTweetId(tweetUrl: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = tweetUrl.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}


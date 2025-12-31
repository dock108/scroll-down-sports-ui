import { ApiConnectionError } from './SportsApiAdapter';
import type { PlayerStat, TeamStat } from './GameAdapter';
import type { PbpEvent } from './PbpAdapter';
import { normalizeMediaType, type TimelinePost } from './PostAdapter';
import { getApiBaseUrl } from '../utils/env';
import { logger } from '../utils/logger';

const getApiBase = () => getApiBaseUrl() || 'http://localhost:8000';

/**
 * A single timeline entry combining a PBP event with its linked social highlights
 */
export interface TimelineEntry {
  event: PbpEvent;
  highlights: TimelinePost[];
}

/**
 * Spoiler-safe game header info (no score)
 */
export interface CatchupGameHeader {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue?: string;
}

/**
 * Final details revealed at the end (contains spoilers)
 */
export interface CatchupFinalDetails {
  homeScore?: number;
  awayScore?: number;
  attendance?: number;
  notes?: string;
}

/**
 * Complete catchup response - the single payload for the catchup page
 */
export interface CatchupResponse {
  game: CatchupGameHeader;
  preGamePosts: TimelinePost[];
  timeline: TimelineEntry[];
  postGamePosts: TimelinePost[];
  playerStats: PlayerStat[];
  teamStats: TeamStat[];
  finalDetails: CatchupFinalDetails;
}

/**
 * API response shapes - matches /api/admin/sports/games/{id}
 */

type ApiGameResponse = {
  game?: ApiGameData;
  team_stats?: ApiTeamStat[];
  player_stats?: ApiPlayerStat[];
  plays?: ApiPbpEvent[];
  social_posts?: ApiSocialPost[];
};

type ApiSocialPost = {
  id?: number;
  post_url?: string;
  posted_at?: string;
  has_video?: boolean;
  team_abbreviation?: string;
  tweet_text?: string;
  video_url?: string;
  image_url?: string;
  source_handle?: string;
  media_type?: 'video' | 'image' | 'none';
};

type ApiGameData = {
  id?: number;
  home_team?: string;
  away_team?: string;
  game_date?: string;
  game_end_time?: string;
  final_whistle_time?: string;
  venue?: string;
  home_score?: number;
  away_score?: number;
};

type ApiTeamStat = {
  team?: string;
  is_home?: boolean;
  stats?: Record<string, unknown>;
};

type ApiPlayerStat = {
  team?: string;
  player_name?: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  minutes?: number;
  raw_stats?: Record<string, unknown>;
};

type ApiPbpEvent = {
  play_index?: number;
  quarter?: number;
  game_clock?: string;
  play_type?: string | null;
  team_abbreviation?: string | null;
  player_name?: string | null;
  description?: string;
  home_score?: number | null;
  away_score?: number | null;
};

export interface CatchupAdapter {
  getCatchupForGame(gameId: string): Promise<CatchupResponse | null>;
}

/**
 * API adapter for the integrated catchup endpoint
 *
 * API endpoint:
 * - GET /api/games/{gameId}/catchup - Get full catchup data for a game
 */
export class CatchupApiAdapter implements CatchupAdapter {
  async getCatchupForGame(gameId: string): Promise<CatchupResponse | null> {
    if (!gameId) {
      logger.warn('CatchupApiAdapter: game id missing.');
      return null;
    }

    const url = `${getApiBase()}/api/admin/sports/games/${gameId}`;

    try {
      const data = await this.fetchJson<ApiGameResponse>(url);
      return this.mapGameResponse(data);
    } catch (error) {
      if (error instanceof ApiConnectionError) {
        throw error;
      }
      logger.warn('CatchupApiAdapter: failed to load catchup.', { error: String(error) });
      return null;
    }
  }

  private async fetchJson<T>(url: string): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      throw new ApiConnectionError('Unable to connect to API. Is the server running?');
    }

    if (!response.ok) {
      throw new ApiConnectionError(`API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Map the game API response to CatchupResponse
   * Weaves social posts into PBP timeline using proportional distribution
   */
  private mapGameResponse(data: ApiGameResponse): CatchupResponse {
    const game = data.game || {};
    const gameId = String(game.id || '');
    
    // Map ALL social posts
    const socialPosts: TimelinePost[] = (data.social_posts || []).map((p) => {
      const mediaType = normalizeMediaType(p.media_type ?? null, p.video_url ?? null, p.image_url ?? null);
      return {
        id: String(p.id || ''),
        gameId,
        team: p.team_abbreviation || '',
        postUrl: p.post_url || '',
        tweetId: this.extractTweetId(p.post_url || ''),
        postedAt: p.posted_at || '',
        hasVideo: mediaType === 'video',
        mediaType,
        mediaTypeRaw: p.media_type ?? null,
        videoUrl: p.video_url || '',
        imageUrl: p.image_url || '',
        sourceHandle: p.source_handle || '',
        tweetText: p.tweet_text || '',
      };
    });

    // Sort social posts by posted time (earliest first)
    const sortedPosts = [...socialPosts].sort((a, b) => 
      new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime()
    );

    // Split posts: pre-game, in-game, post-game with simple heuristics
    const postGamePosts = this.getPostGamePosts(sortedPosts, game);
    const postGameSet = new Set(postGamePosts);
    const remainingPosts = sortedPosts.filter((post) => !postGameSet.has(post));
    const preGameCount = remainingPosts.length > 0 ? Math.max(1, Math.floor(remainingPosts.length * 0.2)) : 0;
    const preGamePosts = remainingPosts.slice(0, preGameCount);
    const inGamePosts = remainingPosts.slice(preGameCount);

    // Convert ALL PBP events to timeline entries
    const pbpEvents = data.plays || [];
    const timeline: TimelineEntry[] = pbpEvents.map((e, index) => ({
      event: {
        id: `pbp-${e.play_index ?? index}`,
        gameId,
        period: e.quarter ?? 0,
        gameClock: e.game_clock || '',
        elapsedSeconds: this.calculateElapsedSeconds(e.quarter ?? 0, e.game_clock || ''),
        eventType: e.play_type || 'play',
        description: e.description || '',
        team: e.team_abbreviation || undefined,
        playerName: e.player_name || undefined,
        homeScore: e.home_score ?? undefined,
        awayScore: e.away_score ?? undefined,
      },
      highlights: [],
    }));

    // Distribute in-game posts proportionally across timeline
    if (timeline.length > 0 && inGamePosts.length > 0) {
      const postsPerSection = Math.ceil(timeline.length / inGamePosts.length);
      
      inGamePosts.forEach((post, postIndex) => {
        // Distribute post to timeline entry based on proportional position
        const targetIndex = Math.min(
          Math.floor(postIndex * postsPerSection),
          timeline.length - 1
        );
        timeline[targetIndex].highlights.push(post);
      });
    }

    // Map player stats from API response
    const playerStats: PlayerStat[] = (data.player_stats || []).map((p) => ({
      team: p.team || '',
      player_name: p.player_name || '',
      points: p.points,
      rebounds: p.rebounds,
      assists: p.assists,
      raw_stats: p.raw_stats || {},
    }));

    // Map team stats from API response
    const teamStats: TeamStat[] = (data.team_stats || []).map((t) => ({
      team: t.team || '',
      is_home: t.is_home ?? false,
      stats: (t.stats || {}) as Record<string, unknown>,
    }));

    return {
      game: {
        id: gameId,
        homeTeam: game.home_team || '',
        awayTeam: game.away_team || '',
        date: game.game_date || '',
        venue: game.venue,
      },
      preGamePosts, // First 20% of posts chronologically
      timeline,
      postGamePosts,
      playerStats,
      teamStats,
      finalDetails: {
        homeScore: game.home_score,
        awayScore: game.away_score,
      },
    };
  }

  /**
   * Group post-game content using available timestamps.
   * TODO: Better post-game grouping once event timestamps are consistently available.
   */
  private getPostGamePosts(posts: TimelinePost[], game: ApiGameData): TimelinePost[] {
    if (!posts.length) return [];

    const endTimeValue = game.final_whistle_time || game.game_end_time || '';
    if (endTimeValue) {
      const endTimestamp = new Date(endTimeValue).getTime();
      if (!Number.isNaN(endTimestamp)) {
        const postGame = posts.filter((post) => {
          const postedAt = new Date(post.postedAt).getTime();
          return !Number.isNaN(postedAt) && postedAt > endTimestamp;
        });
        if (postGame.length > 0) {
          return postGame;
        }
      }
    }

    const fallbackCount = Math.max(1, Math.round(posts.length * 0.1));
    return posts.slice(-fallbackCount);
  }

  /**
   * Extract tweet ID from URL
   */
  private extractTweetId(url: string): string {
    if (!url) return '';
    try {
      const match = url.match(/status\/(\d+)/);
      return match ? match[1] : '';
    } catch {
      return '';
    }
  }

  /**
   * Convert quarter + game clock to elapsed seconds
   */
  private calculateElapsedSeconds(quarter: number, gameClock: string): number {
    const quarterMinutes = 12; // NBA quarters are 12 minutes
    const completedQuarters = Math.max(0, quarter - 1);
    const completedSeconds = completedQuarters * quarterMinutes * 60;

    // Parse game clock (e.g., "5:30.0" or "5:30")
    const match = gameClock.match(/^(\d+):(\d+)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const remainingSeconds = minutes * 60 + seconds;
      const elapsedInQuarter = quarterMinutes * 60 - remainingSeconds;
      return completedSeconds + elapsedInQuarter;
    }

    return completedSeconds;
  }

}

/**
 * Factory function to get the catchup adapter (API-only)
 */
export function getCatchupAdapter(): CatchupAdapter {
  return new CatchupApiAdapter();
}

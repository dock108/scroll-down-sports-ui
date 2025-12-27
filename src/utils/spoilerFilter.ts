/**
 * Spoiler detection utilities for filtering social posts
 * 
 * These patterns help exclude tweets that might reveal game outcomes
 * before the user is ready to see them.
 */

/**
 * Patterns that indicate a final score or game outcome
 */
const SCORE_PATTERNS = [
  // Match score formats like "112-108", "112 - 108", "112–108" (en-dash)
  /\b\d{2,3}\s*[-–—]\s*\d{2,3}\b/,
  
  // Match "W 112-108" or "L 108-112" formats
  /\b[WL]\s*\d{2,3}\s*[-–—]\s*\d{2,3}\b/i,
  
  // Match "Final: 112-108" formats
  /final\s*:?\s*\d{2,3}\s*[-–—]\s*\d{2,3}/i,
];

/**
 * Keywords that strongly indicate game conclusion
 */
const FINAL_KEYWORDS = [
  /\bfinal\b/i,
  /\bfinal score\b/i,
  /\bend of (game|regulation)\b/i,
  /\bgame over\b/i,
  /\bwe win\b/i,
  /\bwe lose\b/i,
  /\bvictory\b/i,
  /\bdefeat\b/i,
  /\bwins\s+\d{2,3}\s*[-–—]\s*\d{2,3}\b/i,
  /\blose[sd]?\s+\d{2,3}\s*[-–—]\s*\d{2,3}\b/i,
];

/**
 * Patterns for recap/summary content
 */
const RECAP_PATTERNS = [
  /\brecap\b/i,
  /\bgame recap\b/i,
  /\bpost-?game\b/i,
  /\bhighlights from\b/i,
  /\bfull (game )?highlights\b/i,
  /\bwatch the (full )?recap\b/i,
];

export interface SpoilerCheckResult {
  isSpoiler: boolean;
  reason?: 'score' | 'final_keyword' | 'recap';
  matchedPattern?: string;
}

/**
 * Check if text contains spoiler content
 * 
 * @param text - The text to analyze (typically tweet caption)
 * @returns Object indicating if spoiler was detected and why
 */
export function checkForSpoilers(text: string): SpoilerCheckResult {
  if (!text || typeof text !== 'string') {
    return { isSpoiler: false };
  }

  // Check for score patterns first (most definitive)
  for (const pattern of SCORE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSpoiler: true,
        reason: 'score',
        matchedPattern: pattern.source,
      };
    }
  }

  // Check for final keywords
  for (const pattern of FINAL_KEYWORDS) {
    if (pattern.test(text)) {
      return {
        isSpoiler: true,
        reason: 'final_keyword',
        matchedPattern: pattern.source,
      };
    }
  }

  // Check for recap patterns
  for (const pattern of RECAP_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSpoiler: true,
        reason: 'recap',
        matchedPattern: pattern.source,
      };
    }
  }

  return { isSpoiler: false };
}

/**
 * Quick boolean check for spoilers
 */
export function containsSpoiler(text: string): boolean {
  return checkForSpoilers(text).isSpoiler;
}

/**
 * Filter an array of posts, removing those with spoiler content
 * 
 * @param posts - Array of posts with a caption/text field
 * @param textField - The field name containing the text to check
 * @returns Filtered array with spoilers removed
 */
export function filterSpoilerPosts<T extends Record<string, unknown>>(
  posts: T[],
  textField: keyof T = 'caption' as keyof T
): T[] {
  return posts.filter((post) => {
    const text = post[textField];
    if (typeof text !== 'string') {
      return true; // Keep posts without text (we don't analyze them)
    }
    return !containsSpoiler(text);
  });
}

/**
 * Configuration for the game social window
 * Exported for use in adapters
 */
export const GAME_WINDOW_CONFIG = {
  /** Hours before game to start capturing posts */
  preGameHours: 2,
  /** Hours after game start to stop capturing posts (avoids most "FINAL" tweets) */
  postGameHours: 3,
} as const;

/**
 * Calculate the social capture window for a game
 */
export function calculateGameWindow(gameStartTime: Date): {
  windowStart: Date;
  windowEnd: Date;
} {
  return {
    windowStart: new Date(
      gameStartTime.getTime() - GAME_WINDOW_CONFIG.preGameHours * 60 * 60 * 1000
    ),
    windowEnd: new Date(
      gameStartTime.getTime() + GAME_WINDOW_CONFIG.postGameHours * 60 * 60 * 1000
    ),
  };
}


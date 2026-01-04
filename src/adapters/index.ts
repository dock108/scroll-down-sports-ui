import { GameAdapter } from './GameAdapter';
import { SportsApiAdapter, ApiConnectionError } from './SportsApiAdapter';

export function getGameAdapter(): GameAdapter {
    return new SportsApiAdapter();
}

export { ApiConnectionError };
export { getSocialPostAdapter } from './SocialPostAdapter';
export type { SocialPostAdapter, GameSocialPost } from './SocialPostAdapter';

// PBP adapter exports
export { getPbpAdapter } from './PbpAdapter';
export type { PbpAdapter, PbpEvent } from './PbpAdapter';

// AI summary adapter exports
export { getAiSummaryAdapter } from './AiSummaryAdapter';
export type { AiSummaryAdapter } from './AiSummaryAdapter';

// Catchup adapter exports (integrated timeline)
export { getCatchupAdapter } from './CatchupAdapter';
export type {
  CatchupAdapter,
  CatchupResponse,
  CatchupGameHeader,
  CatchupFinalDetails,
  TimelineEntry,
} from './CatchupAdapter';

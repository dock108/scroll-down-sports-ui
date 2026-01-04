import { getApiBaseUrl } from '../utils/env';
import { buildApiUrl, fetchJson } from '../utils/http';
import { logger } from '../utils/logger';
import { GamePreview } from '../types';

type ApiGamePreview = {
  game_id?: string | number;
  gameId?: string | number;
  excitement_score?: number;
  excitementScore?: number;
  quality_score?: number;
  qualityScore?: number;
  tags?: string[];
  nugget?: string;
};

const mapGamePreview = (preview: ApiGamePreview, fallbackGameId: string): GamePreview => {
  const gameId = preview.game_id ?? preview.gameId ?? fallbackGameId;
  return {
    gameId: String(gameId),
    excitementScore: preview.excitement_score ?? preview.excitementScore ?? 0,
    qualityScore: preview.quality_score ?? preview.qualityScore ?? 0,
    tags: Array.isArray(preview.tags) ? preview.tags : [],
    nugget: preview.nugget ?? '',
  };
};

export const fetchGamePreview = async (gameId: string): Promise<GamePreview> => {
  if (!gameId) {
    logger.warn('fetchGamePreview: game id missing.');
    throw new Error('Game id is required to fetch a preview.');
  }

  const apiUrl = buildApiUrl(getApiBaseUrl(), `/api/preview/game/${gameId}`);
  const data = await fetchJson<ApiGamePreview>(apiUrl, { cache: 'no-store' });
  return mapGamePreview(data, gameId);
};

import { logger } from './logger';

type JsonOptions = RequestInit & {
  headers?: HeadersInit;
};

export class ApiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const buildApiUrl = (baseUrl: string, path: string) => {
  if (!baseUrl) {
    throw new ApiRequestError('API base URL is not configured.');
  }
  return new URL(path, baseUrl).toString();
};

export const fetchJson = async <T>(url: string, options: JsonOptions = {}): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    logger.warn('Network request failed.', { url, error: String(error) });
    throw new ApiRequestError('Unable to connect to the API. Is the server running?');
  }

  if (!response.ok) {
    logger.warn('API returned error response.', {
      url,
      status: response.status,
      statusText: response.statusText,
    });
    throw new ApiRequestError(`API error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
};
